import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { createPipeline } from './SimClient';

const worldParams = { size: { width: 500, height: 500 } };
createPipeline({ worldParams }).then(channelClient => {
    ReactDOM.render(<App channelClient={channelClient} worldParams={worldParams}/>, document.getElementById('root'));
})

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
