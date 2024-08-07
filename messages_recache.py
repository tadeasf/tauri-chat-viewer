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
    flush_endpoint = "https://backend.jevrej.cz/flush_redis"
    async with httpx.AsyncClient() as client:
        response = await client.get(flush_endpoint)
        if response.status_code == 200:
            logger.info("Redis cache flushed successfully.")
        else:
            logger.error(f"Failed to flush Redis cache: {response.text}")


async def switch_database():
    switch_endpoint = "https://backend.jevrej.cz/switch_db"
    async with httpx.AsyncClient() as client:
        response = await client.get(switch_endpoint)
        if response.status_code == 200:
            logger.info(f"Switched database to {response.text}")
        else:
            logger.error(f"Failed to switch database: {response.text}")
    await asyncio.sleep(8)


async def fetch_current_db():
    db_endpoint = "https://backend.jevrej.cz/current_db"
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


async def fetch_url(collection_name, url_type, db, semaphore):
    # Directly use the semaphore that's passed in.
    async with semaphore, httpx.AsyncClient() as client:
        start = time.perf_counter()
        try:
            url = f"https://backend.jevrej.cz/{url_type}/{collection_name}"
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
@click.option(
    "--semaphore", default=2, help="Semaphore value for limiting concurrency.", type=int
)
@click.option(
    "--collection",
    default=None,
    help="Specific collection name to operate on.",
    type=str,
)
@click.option(
    "--runs",
    default=1,
    help="Number of times to call the endpoint for the given collection.",
    type=int,
)
def cli(semaphore, collection, runs):
    should_switch_db = click.confirm(
        "Do you want to switch the database before running?", default=False
    )
    if should_switch_db:
        flush_cache = False  # Skip flushing cache if switching database
    else:
        flush_cache = click.confirm(
            "Do you want to flush the Redis cache before running?", default=False
        )

    asyncio.run(main(flush_cache, should_switch_db, semaphore, collection, runs))


async def main(
    flush_cache, should_switch_db, semaphore_value, collection_name=None, runs=1
):
    # Semaphores are now correctly initialized within main and passed to fetch_url.
    messages_semaphore = asyncio.Semaphore(semaphore_value)
    photos_semaphore = asyncio.Semaphore(semaphore_value)

    if should_switch_db:
        await switch_database()
    elif flush_cache:
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

    tasks = []
    if collection_name:
        # When a specific collection is specified
        for _ in range(runs):
            tasks += [
                fetch_url(collection_name, "messages", db, messages_semaphore),
                fetch_url(collection_name, "photos", db, photos_semaphore),
            ]
    else:
        # The original behavior for all collections
        collection_names = db.list_collection_names()
        tasks = [
            fetch_url(name, "messages", db, messages_semaphore)
            for name in collection_names
        ] + [
            fetch_url(name, "photos", db, photos_semaphore) for name in collection_names
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

    median_response_time_per_10k_docs = np.nanmedian(messages_per_doc_times) * 10000
    median_response_time_per_10k_photos = np.nanmedian(photos_per_doc_times) * 10000

    total_runtime = time.time() - start_time
    logger.info(f"Total run time: {format_time(total_runtime)} \n")
    logger.info("-----------------------------------------\n")
    logger.info(
        f"Average message response time per collection: {format_time(np.mean(messages_times))}\n"
    )
    logger.info("-----------------------------------------\n")
    logger.info(
        f"Average photo response time per collection: {format_time(np.mean(photos_times))}\n"
    )
    logger.info(
        f"Average number of photos per collection: {np.nanmean(photo_collection_lengths)}\n"
    )
    logger.info("-----------------------------------------\n")
    logger.info(
        f"Median response time per 10000 messages: {format_time(median_response_time_per_10k_docs)}\n"
    )
    logger.info(
        f"Median response time per 10000 photos: {format_time(median_response_time_per_10k_photos)}\n"
    )


if __name__ == "__main__":
    cli()
