import React from "react";
import ReactDOM from "react-dom";
import * as serviceWorker from "./serviceWorker";
import App from "./App";
import { injectGlobal } from "emotion";
import { units, colors, fontWeights } from "./styles";

injectGlobal`
    html * {
      font-family: 'Montserrat', sans-serif;
    }

    > * {
        box-sizing: border-box;
    }
    body, body > * {
        margin: 0;
        width: 100vw;
        height: 100vh;
    }

    fieldset {
      border: 0;
    }

    #root {
      max-width: ${units(280)};
      margin: 0 auto;
    }

    button {
      font-size: ${units(4)};
      padding: ${units(2)} ${units(4)};
      border: 0;
      background-color: ${colors.primaryDark};
      color: ${colors.invertedText};
      font-weight: ${fontWeights.bold};
      transition: all 0.1s;
      &:hover {
        cursor: pointer;
        background-color: ${colors.primary};
      }
    }
`;

ReactDOM.render(<App />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
