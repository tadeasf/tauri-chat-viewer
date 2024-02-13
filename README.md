<!-- @format -->

# How To Develop

You have two available workflows with this app. You can either go for production
build or development build.

## Development

    With development workflow you need react-scripts to start dev secondary.dev.

    ``` bash
    npm run dev-react
    ```

## Production

    First you need to build the React app

    ``` bash
    npm run build-react
    ```

    Second you need to start up the express server which serves the production build. You gotta start both the express server as well as react server in order to play with the production build of the app

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
check production build of the web app. It's neat. Don't ask too many questions.
It's not good for you.
