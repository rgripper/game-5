import React, { Component, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import './App.css';

function App () {

    useEffect(() => {
      var app = new PIXI.Application(800, 600, {backgroundColor : 0x1099bb});
      document.getElementById('app')!.appendChild(app.view);
    })

    return (
      <div className="App" id="app">
      </div>
    );
}

export default App;
