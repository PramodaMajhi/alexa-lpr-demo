# Overview

This skill uses the [Alexa Skills Kit SDK for Node JS](https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs).

To deploy the skill, it uses the [Alexa Skills Kit CLI](https://developer.amazon.com/docs/smapi/quick-start-alexa-skills-kit-command-line-interface.html).

> Note: We used a project called `serverless` to deploy our web services to AWS Lambda on some earlier projects. Although the web service will still be deployed to AWS Lambda, this project does not use the `serverless` project in any way. 

## Important 

The `ask deploy` command not only deploys the web service to AWS Lambda, but it also deploys the Alexa skill definition, including the invocation phrase, and the language model (intents and utterances).

  > Note: if you try to maintain intents, utterances, and invocation phrase on the Alexa skills kit web page, you will experience a myriad of problems. Please maintain the intents and utterances in this project.

# Build instructions

The `ask deploy` command packages everything in the './lambda/custom' directory and uploads it to AWS. If this directory does not include the `node_modules` directory, the web service function will fail.

Amazon addressed this by putting the package.json file in the './lambda/custom' directory and by running `npm install` from that directory.

However, this project uses Typescript. In order to run the `tsc` command, the `node_modules` directory must be in the project directory.  We'll address that below.

## Prerequisites

1. [Node and npm](https://nodejs.org/en/)

2. [Typescript](https://www.typescriptlang.org/)

    ```sh
    > npm install -g typescript
    ```

3. [AWS Developer credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html)

4. [Access to the Alexa Skills console](https://developer.amazon.com/alexa/console/ask)

5. [The Amazon Alexa Skills kit CLI](https://www.npmjs.com/package/ask-cli)

    ```sh
    > npm install -g ask-cli
    ```

## Build Steps

Install the libraries:

```sh
> npm install
```

For the initial build and whenever you change any of the Typescript code and want to test or deploy, be sure to transpile the code:

```sh
$ tsc
```

This will transpile the Typescript in the `custom` directory and place the resulting Javascript files in the `lambda\custom` directory.

To package and deploy the code to AWS:

```sh
$ ask deploy
```

## Testing
