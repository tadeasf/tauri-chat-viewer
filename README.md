<!-- @format -->

# How To Develop

The workflow of the app works like this:

    First you need to build the React app

    ``` bash
    npm run build-react
    ```

    Second you need to start up the express server which either serves the production build or use morgan for development mode when NODE_ENV variable isn't defined in .env file. If you want to build+start up server in one command you can use provided start script

    ``` bash
    npm run server
    npm run start
    ```

    Third you can dev/build via **tauri** ❤️

    ``` bash
    npm run tauri dev
    npm run tauri build
    ```

Why are we serving the build files ? It's just one of many options how you can
develop web apps with automatic re-rendering on save. It's neat. Don't ask too
many questions. It's not good for you.
