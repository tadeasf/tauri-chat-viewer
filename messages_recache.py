import asyncio
from pymongo import MongoClient
import httpx
from dotenv import load_dotenv
import os
import time
import numpy as np
from loguru import logger
import click

load_dotenv()
uri = os.getenv("MONGODB_URI")

logger.add("messages_recache.log", rotation="1 day", retention="7 days")

client = MongoClient(uri)


async def flush_redis_cache():
    flush_endpoint = "https://secondary.dev.tadeasfort.com/flush_redis"
    async with httpx.AsyncClient() as client:
        response = await client.get(flush_endpoint)
        if response.status_code == 200:
            logger.info("Redis cache flushed successfully.")
        else:
            logger.error(f"Failed to flush Redis cache: {response.text}")


async def switch_database():
    switch_endpoint = "https://secondary.dev.tadeasfort.com/switch_db"
    async with httpx.AsyncClient() as client:
        response = await client.get(switch_endpoint)
        if response.status_code == 200:
            logger.info(f"Switched database to {response.text}")
        else:
            logger.error(f"Failed to switch database: {response.text}")
    await asyncio.sleep(8)


async def fetch_current_db():
    db_endpoint = "https://secondary.dev.tadeasfort.com/current_db"
    async with httpx.AsyncClient() as client:
        response = await client.get(db_endpoint)
        if response.status_code == 200:
            logger.info(f"Fetched current_db endpoint: {response.text}")
            return response.text.strip()
        else:
            logger.error(
                f"Failed to fetch {db_endpoint} for current_db: {response.text}"
            )
            return None


async def fetch_url(collection_name, url_type, db):
    semaphore = messages_semaphore if url_type == "messages" else photos_semaphore
    async with semaphore, httpx.AsyncClient() as client:
        start = time.perf_counter()
        try:
            url = f"https://secondary.dev.tadeasfort.com/{url_type}/{collection_name}"
            response = await client.get(url)
            elapsed = time.perf_counter() - start
            if response.status_code in range(200, 300):
                return (
                    url_type,
                    elapsed,
                    collection_name,
                    db[collection_name].estimated_document_count(),
                )
            else:
                logger.error(
                    f"Response failed for {collection_name} endpoint: {response.status_code}"
                )
        except Exception as e:
            logger.error(f"Failed to fetch {url}: {e}")
        return url_type, None, collection_name, None


def format_time(seconds):
    if seconds < 1:
        return f"{seconds * 1000:.2f}ms"
    elif seconds < 60:
        return f"{seconds:.2f}s"
    else:
        mins, secs = divmod(seconds, 60)
        if mins < 60:
            return f"{int(mins)}m {secs:.2f}s"
        else:
            hours, mins = divmod(mins, 60)
            return f"{int(hours)}h {int(mins)}m {secs:.2f}s"


@click.command()
def cli():
    """CLI interface that decides whether to switch the database or flush the Redis cache before running."""
    should_switch_db = click.confirm(
        "Do you want to switch the database before running?", default=False
    )
    if should_switch_db:
        flush_cache = False  # Skip flushing cache if switching database
    else:
        flush_cache = click.confirm(
            "Do you want to flush the Redis cache before running?", default=False
        )
    asyncio.run(main(flush_cache, should_switch_db))


async def main(flush_cache, should_switch_db):
    if should_switch_db:
        await switch_database()
    elif flush_cache:  # Only ask about flushing cache if not switching DB
        await flush_redis_cache()

    start_time = time.time()
    messages_times = []
    photos_times = []
    collection_lengths = []
    photo_collection_lengths = []

    current_db = await fetch_current_db()
    if not current_db:
        logger.error("Current database could not be fetched. Exiting...")
        return
    db = client[current_db]
    collection_names = db.list_collection_names()

    tasks = [fetch_url(name, "messages", db) for name in collection_names] + [
        fetch_url(name, "photos", db) for name in collection_names
    ]

    responses = await asyncio.gather(*tasks)

    # Process the responses
    for response in responses:
        url_type, elapsed, collection_name, count = response
        if elapsed is not None:
            if url_type == "messages":
                messages_times.append(elapsed)
                collection_lengths.append(count)
            else:
                photos_times.append(elapsed)
                photo_collection_lengths.append(count)

    collection_lengths = np.array(collection_lengths, dtype=float)
    photo_collection_lengths = np.array(photo_collection_lengths, dtype=float)
    collection_lengths[collection_lengths == 0] = np.nan
    photo_collection_lengths[photo_collection_lengths == 0] = np.nan

    messages_per_doc_times = np.array(messages_times) / collection_lengths
    photos_per_doc_times = np.array(photos_times) / photo_collection_lengths

    messages_per_doc_times = np.nan_to_num(messages_per_doc_times, nan=0.0)
    photos_per_doc_times = np.nan_to_num(photos_per_doc_times, nan=0.0)

    median_response_time_per_50k_docs = np.nanmedian(messages_per_doc_times) * 50000
    median_response_time_per_1000_photos = np.nanmedian(photos_per_doc_times) * 1000

    total_runtime = time.time() - start_time
    logger.info(f"Total run time: {format_time(total_runtime)} \n")
    logger.info("------------MESSAGES endpoint------------\n")
    logger.info(
        f"Median response time per 50000 documents: {format_time(median_response_time_per_50k_docs)}\n"
    )
    logger.info("-----------------------------------------\n")
    logger.info(
        f"Average response time per collection: {format_time(np.mean(messages_times))}\n"
    )
    logger.info(f"Average collection length: {np.nanmean(collection_lengths)}\n")

    logger.info("------------PHOTOS endpoint------------\n")
    logger.info(
        f"Median response time per 1000 photos: {format_time(median_response_time_per_1000_photos)}\n"
    )
    logger.info("-----------------------------------------\n")
    logger.info(
        f"Average response time per collection: {format_time(np.mean(photos_times))}\n"
    )
    logger.info(f"Average photo length: {np.nanmean(photo_collection_lengths)}\n")


# Initialize semaphores
messages_semaphore = asyncio.Semaphore(1)
photos_semaphore = asyncio.Semaphore(1)

if __name__ == "__main__":
    cli()
