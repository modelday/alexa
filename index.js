/* eslint-disable  func-names */
/* eslint-disable  no-console */
/* eslint-disable  no-restricted-syntax */

const Alexa = require('ask-sdk');
var http = require('http');

const SKILL_NAME = 'Hello Markets';
const FALLBACK_MESSAGE_DURING_GAME = `${SKILL_NAME} can't help you with that.  Try asking about a company.`;
const FALLBACK_REPROMPT_DURING_GAME = 'Please ask about a company.';
const FALLBACK_MESSAGE_OUTSIDE_GAME = `${SKILL_NAME} can't help you with that.  It will tell you about a company. You can say, ask Bloomberg about Amazon.`;
const FALLBACK_REPROMPT_OUTSIDE_GAME = 'Say a source.';

let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];


function httpGet(options) {
  return new Promise(((resolve, reject) => {

    const request = http.request(options, (response) => {
      response.setEncoding('utf8');
      let returnData = '';

      if (response.statusCode < 200 || response.statusCode >= 300) {
        return reject(new Error(`${response.statusCode}: ${response.req.getHeader('host')} ${response.req.path}`));
      }

      response.on('data', (chunk) => {
        returnData += chunk;
      });

      response.on('end', () => {
        resolve(JSON.parse(returnData));
      });

      response.on('error', (error) => {
        reject(error);
      });
    });
    
    request.on('error', function (error) {
      reject(error);
    });
    
    request.end();
  }));
}

const LaunchRequest = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.session.new || handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  async handle(handlerInput) {
    const responseBuilder = handlerInput.responseBuilder;
    
    const speechOutput = `Welcome to ${SKILL_NAME}. Please ask about a company`;
    const reprompt = 'Ask about a company';
    
    return responseBuilder
      .speak(speechOutput)
      .reprompt(reprompt)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Thanks for trying Hello Markets!')
      .getResponse();
  },
};

const SessionEndedRequest = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const HelpIntent = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechOutput = 'Try asking about a company';
    const reprompt = 'Try asking about a company.';

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(reprompt)
      .getResponse();
  },
};

const HelloMarketsIntent = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return  request.type === 'IntentRequest' && request.intent.name === 'HelloMarketsIntent';
  },
  async handle(handlerInput) {
    const { requestEnvelope, attributesManager, responseBuilder } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();

    let source = requestEnvelope.request.intent.slots.source.value;
    const product = requestEnvelope.request.intent.slots.product.value;
    
    if(!source) {
      source = "Bloomberg";
    }
    console.log("Hi")
    console.log(product);
    var options = {
      host: "newsapi.org",
      path: "/v2/everything?q=" + product + "&sources=" + source + "&from=2018-6-28&apiKey=f5af9d912abb4d3496726b9583f2d972",
      method: 'GET',
      headers: {
        accept: 'application/json'
      }
    }

    return new Promise((resolve, reject) => {
      httpGet(options).then((d) => {
        var date = new Date(d.articles[0].publishedAt);

        let day = months[date.getUTCMonth()] + " " + date.getUTCDate();

        let readTime = "From " + source + " on " + day + ": "
        let title = d.articles[0].title;
        let desc = d.articles[0].description;

        resolve(handlerInput.responseBuilder
          .speak(readTime + title + ". " + desc + ". ")
          .reprompt(readTime + title + ". " + desc + ". ")
          .getResponse());
       }).catch((error) => {
        console.log(error)
        resolve(handlerInput.responseBuilder.speak('Please try asking about a company again').getResponse());
      });
    });
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please try asking about a company again')
      .reprompt('Sorry, I can\'t understand the command. Please try asking about a company again')
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequest,
    ExitHandler,
    SessionEndedRequest,
    HelpIntent,
    HelloMarketsIntent,
  )
  .addErrorHandlers(ErrorHandler)
  .withAutoCreateTable(true)
  .lambda();
