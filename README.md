# Overview

This skill uses the [Alexa Skills Kit SDK for Node JS](https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs).

To deploy the skill, it uses the [Alexa Skills Kit CLI](https://developer.amazon.com/docs/smapi/quick-start-alexa-skills-kit-command-line-interface.html).

> Note: We used a project called `serverless` to deploy our web services to AWS Lambda on some earlier projects. Although the web service will still be deployed to AWS Lambda, this project does not use the `serverless` project in any way. 

## Important 

The `ask deploy` command not only deploys the web service to AWS Lambda, but it also deploys the Alexa skill definition, including the invocation phrase, and the language model (intents and utterances).

  > Note: if you try to maintain intents, utterances, and invocation phrase on the Alexa skills kit web page, you will experience a myriad of problems. Please maintain the intents and utterances in this project.

# Build instructions

## Overview

The `ask deploy` command packages everything in the './lambda/custom' directory and uploads it to AWS. Therefore all module dependencies must also be in this directory. Amazon addressed this by putting the `package.json` file in the './lambda/custom' directory and having us run `npm install` from that directory.

This project uses Typescript. There are a few key changes supporting this:

1. Typescript has been configured to write the transpiled files into the `./lambda` directory . The files from the `./custom` directory will be transpiled into the `./lambda/custom` directory and the files in the `./test` directory will be transpiled into `./lambda/test` directory.

2. Typescript has been configured to reference the modules in the `./lambda/custom/node_modules` so they only need to be located in a single place without copying or linking.

3. TSC requires several modules at transpile time that are not required at run-time. To reduce the run-time size, there is a separate `package.json` file and `node_modules` at the project root level which contains these modules.

There are all configured in the following lines in `tsconfig.json`:

```
  "outDir": "./lambda",
  "baseUrl": ".",
  "paths": {
    "*": [
      "*",
      "./lambda/custom/node_modules/*"
    ]
  },
```

## Warning

> Knowning that the `tsc` command targets output to the `./lamdba/custom` directory, it may be tempting to delete that directory before a build. However, that directory also includes a `package.json` file (and, after running npm install will contain a `package-lock.json` file and `node_modules` directory, so **DON'T DELETE IT**)

## Prerequisites

1. [Node 8 or 9 and npm](https://nodejs.org/en/)

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

1. Install the libraries in the `./lambda/custom` directory:

```sh
> cd $PROJECT_ROOT/lambda/custom
> npm install
```

2. Install the libraries in the project root directory:

```sh
> cd $PROJECT_ROOT
> npm install
```

3. For the initial build and whenever you change any of the Typescript code and want to test or deploy, be sure to transpile the code:

```sh
$ tsc
```

4. If you have not already, be sure to run `ask init`. This configures which of your AWS credentials will be used to deploy the web service, and which Alexa account will be used to deploy the skill.
   
5. To package and deploy the skill and the service to AWS:

```sh
$ ask deploy
```

## Testing

There are no unit tests, but there is a test of an entire "conversation" in `./test/test.ts`. After running `tsc`, this will be in `./lambda/test/test.js`.

To run it type:

```sh
$ node ./lambda/test/test.js
```



