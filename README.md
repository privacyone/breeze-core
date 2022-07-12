# ![Breeze Icon](misc/breeze.png) Breeze

Breeze is a privacy focused browser based on the Chromium open-source project, currently available for [Windows](../../../breeze-windows) and [macOS](../../../breeze-macos).

Breeze evolved from the [ungoogled-chromium](https://github.com/Eloston/ungoogled-chromium) project with some key additions. We wanted to make an all-around browser that provides users with enhanced privacy and security while keeping the browsing experience clean and simple.

## Features Overview

#### Ungoogled Chromium Browser

Chromium is the most popular platform for browsers since it offers a great combination of speed, functionality and intuitiveness. However, Chromium is Google owned and thus relies on their services which may raise some concerns.

This is why we chose to build our browser upon ungoogled-chromium's work which, in essence, removes all Google web services from Chromium.

Learn more on the [ungoogled-chromium repository](https://github.com/Eloston/ungoogled-chromium)

#### Privacy and Security

Using a few integrated `browser extensions`, Breeze offers a high level of ad blocking, tracking attempt prevention and security without making the user go through any trouble achieving such a browsing experience.

Learn more [here](../../../supporting-extensions).

#### Privacy Master Controller

An interface that provides users with quick access to useful privacy and security settings and displays the count of various unwanted _elements_ blocked by Breeze.

Learn more [here](../../../privacy-master-extension).

#### Dashboard

An internal Breeze page that provides users with insight into blocking statistics and visualizes relationships between third parties and sites they visit.

#### Integrated Updater

To make sure you're protected by the latest updates, Breeze automatically updates when a new version of the browser is available on your device. Updates happen seamlessly in the background when you close and reopen Breeze.

For macOS we use [Sparkle framework](https://sparkle-project.org/).

For Windows we use our fork of [Omaha Updater](https://github.com/google/omaha).

#### Minor Features

We also put effort into minor customizations we felt would enhance users' browsing experience, which can be found in our `patches`. We are open to any and all user suggestions in the future.

## Downloads

The latest version for macOS and Windows 10 can be found on our temporary [website](https://www.breezebrowser.io/breeze/manual-download-redirect/).

## About Us

We are a small team of IT and programming enthusiasts making our first venture into a big project such as this. Being that there is no large-scale development team nor structure for now, we solve problems, implement new ideas and adapt on the fly.

## Contributing

Both help with further development and user feedback are of great significance for making this project grow and improve. 
You can do so by using GitHub issues, pull requests or our [feedback form](https://www.breezebrowser.io/breeze/utility/in-app/send-feedback/).

## Build Process

Coming soon.

## Credits

*  [The Chromium Project](https://www.chromium.org/)

*  [ungoogled-chromium](https://github.com/Eloston/ungoogled-chromium)

*  [Supporting extensions](../../../supporting-extensions/README.md)

## License

See [LICENSE](LICENSE)
