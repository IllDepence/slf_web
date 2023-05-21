/*
 * Stadt, Land, Fluss
 *
 * Class based implementation using ES6 features of the game state and logic.
 */


class Player {

  constructor(name, color, id = null, score = 0) {
    this.id = id; // peerJS ID
    this.name = name;
    this.color = color;
    this.score = score;
  }

}

class Answer {

  constructor(player, column, answer, score = null) {
    this.player = player;
    this.column = column;
    this.answer = answer;
    this.score = score;
  }

}

class Round {
  // a round has
  // - a letter
  // - an attribute indicating if the round is finished
  // - a list of answers
  // each answer has
  // - an ordinal number (implicit by order of answer list)
  // - a column name
  // - a player
  // - the answer itself

  constructor(letter = null, finished = false, answers = []) {
    this.letter = letter;
    this.finished = finished;
    this.answers = answers;
  }

  end() {
    this.finished = true;
  }

  addAnswer(player, column, answer) {
    this.answers.push(new Answer(player, column, answer));
  }

}

class Game {

  // init view element IDs
  #startScreenElemId = "startScreen";
  #initPlayButtonElemId = "initPlayButton";
  #initHostButtonElemId = "initHostButton";
  // choose name view element IDs
  #chooseNameScreenElemId = "chooseNameScreen";
  #chooseNameFormElemId = "chooseNameForm";
  #playerColorInputElemId = "playerColorInput";
  #playerNameInputElemId = "playerNameInput";
  // choose server view element IDs
  #chooseServerScreenElemId = "chooseServerScreen";
  #chooseServerFormElemId = "chooseServerForm";
  #serverIdPlayerInputElemId = "serverIdPlayerInput";
  #serverPwPlayerInputElemId = "serverPwPlayerInput";
  // server view element IDs
  #hostScreenElemId = "serverScreen";
  #serverIdInputElemId = "serverId";
  #serverIdCopyElemId = "copyServerId";
  #serverPwInputElemId = "serverPw";
  #serverPwSetElemId = "serverPwSet";
  #gameColumnsInputElemId = "gameColumns";
  #gameColumnsSetElemId = "gameColumnsSet";
  #playerListElemId = "playerList";
  // player view element IDs
  #playScreenElemId = "playScreen";
  #gameAnswerTableElemId = "gameAnswerTable";
  #gameInputTableElemId = "gameInputTable";
  #pointInputTableElemId = "pointInputTable";
  #peerListElemId = "peerList";

  constructor(
    columns = [],
    players = [],
    player = null,  // player side only
    rounds = [],
    serverId = null,
    serverPw = null,
    serverConn = null,  // player side only
    peerJsObj = null,
  ) {
    this.columns = columns;
    this.players = players;
    this.player = player;  // player side only
    this.rounds = rounds;
    this.serverId = serverId;
    this.serverPw = serverPw;
    this.serverConn = serverConn;  // player side only
    this.peerJsObj = peerJsObj;
    // setup UI
    this.uiState = "start";
    document.addEventListener('DOMContentLoaded', () => {
      this.setUiEventListeners();
      this.drawBaseUi();
    });
  }

  updateGameState(state) {
    // complete update of the game state
    // use columns as is (are just strings)
    this.columns = state.columns;
    // cast player objects
    this.players = state.players.map(
      (player) => new Player(player.name, player.color, player.id, player.score)
    );
    // cast round objects
    this.rounds = state.rounds.map(
      (round) => new Round(round.letter, round.finished, round.answers)
    );
    // update UI accordingly
    this.drawGameUi();
  }

  addPlayer(player) {
    console.log("adding player", player);
    this.players.push(player);
  }

  getCurrentRound() {
    // if there is no non-finished round, start a new one
    if (this.rounds.length === 0 || this.rounds[this.rounds.length - 1].finished) {
      this.startRound();
    }
    // return the current round
    return this.rounds[this.rounds.length - 1];
  }

  startRound(letter) {
    // start a new round with a given letter
    this.rounds.push(new Round(letter));
  }

  endRound() {
    // end the current round
    this.getCurrentRound().end();
  }

  answeredAll() {
    // check if we have answered all columns
    return this.getCurrentRound().answers.filter(
      (answer) => answer.player.id === this.player.id
    ).length === this.columns.length;
  }

  addAnswer(player, column, answer) {
    // add answer to current round in local game state
    this.getCurrentRound().addAnswer(player, column, answer);
    // send single answer dot to server
    this.sendSingleAnswerDotToServer(player, column);
    // if the player gave an answer for every column, draw the point input table
    if (this.answeredAll()) {
      this.drawPointInputTable();
    }
  }

  sumScore(rounds) {
    // sum up the scores of a given list of rounds
    return rounds.reduce(
      (a, b) => a + b.answers.reduce(
        (a, b) => a + b.score, // sum up scores
        0
      ),
      0
    );
  }

  getScoreCurrentRound(player) {
    return this.sumScore([this.getCurrentRound()]);
  }

  getTotalScore(player) {
    return this.sumScore(this.rounds);
  }

  setUiState(state) {
    this.uiState = state;
    this.drawBaseUi();
    this.drawGameUi();
  }

  drawBaseUi() {
    // hide all UI elements
    const screens = [
      this.#startScreenElemId,
      this.#chooseNameScreenElemId,
      this.#chooseServerScreenElemId,
      this.#hostScreenElemId,
      this.#playScreenElemId
    ];
    screens.forEach((screen) => {
      document.getElementById(screen).style.display = "none";
    });
    // show the UI element for the given state
    switch (this.uiState) {
      case "start":
        document.getElementById(this.#startScreenElemId).style.display = "block";
        break;
      case "chooseName":
        document.getElementById(this.#chooseNameScreenElemId).style.display = "block";
        break;
      case "chooseServer":
        document.getElementById(this.#chooseServerScreenElemId).style.display = "block";
        break;
      case "play":
        document.getElementById(this.#playScreenElemId).style.display = "block";
        break;
      case "host":
        document.getElementById(this.#hostScreenElemId).style.display = "block";
        break;
    }
  }

  setUiEventListeners() {
    document.getElementById(this.#initHostButtonElemId).addEventListener('click', () => {
      this.setUiState("host");
    });
    document.getElementById(this.#initPlayButtonElemId).addEventListener('click', () => {
      this.setUiState("chooseName");
    });
    document.getElementById(this.#chooseNameFormElemId).addEventListener('submit', (e) => {
      e.preventDefault();
      // set the player name and color
      let playerName = document.getElementById(this.#playerNameInputElemId).value;
      let playerColor = document.getElementById(this.#playerColorInputElemId).value;
      this.player = new Player(playerName, playerColor);
      this.setUiState("chooseServer");
    });
    document.getElementById(this.#chooseServerFormElemId).addEventListener('submit', (e) => {
      e.preventDefault();
      // set the server ID and password
      let serverId = document.getElementById(this.#serverIdPlayerInputElemId).value;
      let serverPw = document.getElementById(this.#serverPwPlayerInputElemId).value;
      this.serverId = serverId;
      this.serverPw = serverPw;
      this.setUiState("play");
    });
  }

  ensurePeerJsId(callbackFunction) {
    console.log('creating peerJS object');
    const peer = new Peer();
    peer.on('open', id => {
      // set own peerJsObj
      this.peerJsObj = peer;
      // if in play mode, add peerJS ID to player object
      if (this.uiState == "play") {
        this.player.id = id;
      }
      console.log(`acquired peer ID: ${id}`);
      callbackFunction();
    });
  }

  ensureClientServerConnection(callbackFunction) {
    // in play mode, connect to the server
    if (this.uiState == "play") {
      console.log('connecting to server');
      this.serverConn = this.peerJsObj.connect(this.serverId, {
        metadata: {
          serverPw: this.serverPw,
          player: this.player
        }
      });
      // Set handler for receiving messages in a way that
      // ensures that the game object is the "this" object
      this.serverConn.on('data', data => {
        this.handleData(data);
      });
      this.serverConn.on('open', () => {
        // suucessfully connected to server
        // TODO: check if server accepted the password
        callbackFunction();
      });
    }
    // in host mode set handler for receiving new client connections
    else if (this.uiState == "host") {
      console.log('setting up callbacks for incoming connections');
      this.peerJsObj.on('connection', conn => {
        this.handleIncomingPlayerConnection(conn);
        conn.on('data', data => {
          this.handleData(data);
        });
      });
      // done
      this.serverConn = true; // fake connection because we are the server
      callbackFunction();
    }
  }

  handleIncomingPlayerConnection(conn) {
    // check if the player is already known
    if (this.isPlayerKnown(conn.metadata.player)) {
      console.log(`player ${conn.metadata.player.name} is already known`);
      return;
    }
    // check the password if one is set
    if (this.serverPw != null && this.serverPw != conn.metadata.serverPw) {
      console.log(`wrong password for player ${conn.metadata.player.name}`);
      return;
    }
    console.log(`adding player ${conn.metadata.player.name}`);
    this.addPlayer(conn.metadata.player);
    // send updated game state to all players after a short delay
    setTimeout(() => {
      this.sendGameStateToPlayers();
    } , 1000);
    this.drawGameUi();
  }

  updateGameStateMessage() {
    return {
      type: "updateGameState",
      payload: {
        columns: this.columns,
        players: this.players,
        rounds: this.rounds
      }
    };
  }

  singleAnswerDotMessage(column) {
    return {
      type: "singleAnswerDot",
      payload: {
        player: this.player,
        column: column
      }
    };
  }

  getPlayerByPeerId(peerId) {
    // get the player object corresponding to a peerJS ID
    return this.players.find((p) => p.id == peerId);
  }

  sendSingleAnswerDotToPlayers(dotMsg) {
    this.sendMessageToPlayers(dotMsg);
  }

  handleSingleAnswerDot(dot) {
    // put a dot below the input field
    let column = dot.column;
    let player = dot.player;
    // put player's answer dot in the column
    let inputTableBodyCellElemId = this.#gameInputTableElemId + "-" + this.idSafe(column) + "-dots";
    console.log(`putting dot in ${inputTableBodyCellElemId}`);
    let inputTableBodyCellElem = document.getElementById(inputTableBodyCellElemId);
    inputTableBodyCellElem.appendChild(this.playerDotElement(player));
  }

  sendSingleAnswerDotToServer(player, column) {
    // assert that we are in play mode
    if (this.uiState != "play") {
      console.log('not in play mode, not sending single answer dot to server');
      return;
    }
    // send the single answer dot to the server
    console.log('sending single answer dot to server');
    this.serverConn.send(this.singleAnswerDotMessage(column));
  }

  sendGameStateToServer() {
    // assert that we are in play mode
    if (this.uiState != "play") {
      console.log('not in play mode, not sending game state to server');
      return;
    }
    // send the game state to the server
    console.log('sending game state to server');
    this.serverConn.send(this.updateGameStateMessage());
  }

  sendGameStateToPlayers() {
    this.sendMessageToPlayers(this.updateGameStateMessage());
  }

  sendMessageToPlayers(message) {
    // assert that we are in host mode
    if (this.uiState != "host") {
      console.log('not in host mode, not sending game state to players');
      return;
    }
    // send the game state to all players
    let connections = this.peerJsObj.connections;
    // for all connections, check if they correspond to a player
    // and if so, send the game state to them
    for (let connId in connections) {
      let conns = connections[connId] // list (empty if no connection)
      if (conns.length == 0) {
        continue;
      }
      let conn = conns[0]; // Note: can there be multiple connections per peer?
      let player = this.getPlayerByPeerId(connId);
      if (player != null) {
        console.log(`sending ${message.type} message to player ${player.name}`);
        conn.send(message);
      }
    }
  }

  isPlayerKnown(player) {
    // check if a player is already in the list of players
    return this.players.some((p) => p.name == player.name && p.id == player.id);
  }

  handleData(data) {
    // check if data has a type and payload field
    if (!("type" in data) || !("payload" in data)) {
      console.log('received data without type or payload field');
      console.log(data);
      return;
    }
    let messageType = data.type;
    // update game state message
    if (messageType == "updateGameState") {
      this.updateGameState(data.payload);
      // if we're the server, send the updated game state to all players
      if (this.uiState == "host") {
        this.sendGameStateToPlayers();
      }
    }
    // single answer dot message
    else if (messageType == "singleAnswerDot") {
      // if we're the server, relay the message to all players
      if (this.uiState == "host") {
        this.sendSingleAnswerDotToPlayers(data);
      }
      // if we're a player, handle the message
      else if (this.uiState == "play") {
        this.handleSingleAnswerDot(data.payload);
      }
    }
  }

  drawGameUi() {
    // if we're not in play or host mode, don't draw anything
    if (!(this.uiState == "play" || this.uiState == "host")) {
      console.log('not in play or host mode, not drawing game UI');
      return;
    }
    // ensure peerJS connection
    if (this.peerJsObj == null) {
      console.log('setting up peerJS connection');
      // call ensurePeerJsId with drawGameUi as callback
      this.ensurePeerJsId(() => {
        this.drawGameUi();
      });
      return;
    }
    // ensure client/server connection
    if (this.serverConn == null) {
      console.log('setting up client/server connection');
      // call ensureClientServerConnection with drawGameUi as callback
      this.ensureClientServerConnection(() => {
        this.drawGameUi();
      });
    }
    // draw the UI
    if (this.uiState == "host") {
      console.log('drawing host UI');
      this.drawServerUi();
    }
    else if (this.uiState == "play") {
      console.log('drawing play UI');
      this.drawPlayUi(this.player);
    }
  }

  deactiveServerPwInputs() {
    // deactivate the button
    let pwButt = document.getElementById(this.#serverPwSetElemId);
    pwButt.disabled = true;
    pwButt.textContent = "Done";
    pwButt.classList.remove("is-light");
    // make the input field read-only
    document.getElementById(this.#serverPwInputElemId).readOnly = true;
  }

  checkGameColumns() {
    // helper function to check the game columns input
    // and update the button text accordingly
    let gameColumnsInput = document.getElementById(this.#gameColumnsInputElemId);
    let regex = /^(?!\s*,)(?!.*,\s*$)(?!.*,\s*,).+$/;
    let gameColumnsSet = document.getElementById(this.#gameColumnsSetElemId);
    let gameColumnsSetText = '';
    if (!regex.test(gameColumnsInput.value)) {
      gameColumnsInput.classList.add("is-invalid");
      gameColumnsInput.style.backgroundColor = "#ffe5e5";
      gameColumnsSetText = 'Set Columns';
    } else {
      gameColumnsInput.classList.remove("is-invalid");
      gameColumnsInput.style.backgroundColor = "";
      let columns = gameColumnsInput.value.split(/\s*,\s*/);
      let numCols = columns.length;
      gameColumnsSetText = `Set Columns (${numCols})`;
    }
    gameColumnsSet.textContent = gameColumnsSetText;
  }

  drawServerUi() {
    this.serverId = this.peerJsObj.id;
    // show the server ID if game columns are set
    if (this.gameColumns != null && this.gameColumns.length > 0) {
      document.getElementById(this.#serverIdInputElemId).value = this.serverId;
    }
    // initialize server ID copy button
    document.getElementById(this.#serverIdCopyElemId).addEventListener("click", () => {
      navigator.clipboard.writeText(this.serverId);
    });

    // show server PW if already set (i.e. when redrawing the UI)
    if (this.serverPw != null) {
      document.getElementById(this.#serverPwInputElemId).value = this.serverPw;
      this.deactiveServerPwInputs();
    }
    else{
      // initialize server password set button
      document.getElementById(this.#serverPwSetElemId).addEventListener("click", () => {
        // set the server password
        this.serverPw = document.getElementById(this.#serverPwInputElemId).value;
        this.deactiveServerPwInputs();
      });
    }

    // setup game columns input
    let gameColumnsInput = document.getElementById(this.#gameColumnsInputElemId);
    // run prior to user input once if game columns aren't set yet
    if (this.columns.length == 0) {
      this.checkGameColumns(); 
    }
    // set eventlistener on input
    gameColumnsInput.addEventListener("input", this.checkGameColumns.bind(this));
    // setup set game columns button
    let gameColumnsSet = document.getElementById(this.#gameColumnsSetElemId);
    gameColumnsSet.addEventListener("click", () => {
      if (!gameColumnsInput.classList.contains("is-invalid")) {
        let parsedColumns = [];
        gameColumnsSet.classList.remove("is-warning");
        gameColumnsSet.disabled = true;
        gameColumnsSet.textContent = "Done";
        let columns = gameColumnsInput.value.split(/\s*,\s*/);
        parsedColumns.push(...columns);
        // set the game columns
        this.columns = parsedColumns;
        gameColumnsInput.disabled = true;
        // Reveal server ID for copying
        let serverIdInput = document.getElementById(this.#serverIdInputElemId);
        serverIdInput.value = this.serverId;
      }
    });

    // draw the player list
    let playerListElem = document.getElementById(this.#playerListElemId);
    // clear
    playerListElem.innerHTML = "";
    // fill
    this.players.forEach((player) => {
      let row = playerListElem.insertRow();
      row.insertCell().appendChild(this.playerDotElement(player));
      row.insertCell().innerHTML = player.name;
      row.insertCell().innerHTML = player.id;
      row.insertCell().innerHTML = player.score;
    });
  }

  playerDotElement(player) {
    let dotSpan = document.createElement("span");
    dotSpan.innerHTML = "●";
    dotSpan.style.color = player.color;
    return dotSpan;
  }

  idSafe(str) {
    // helper function to make a string safe for use in HTML element IDs
    return str.replace(/[^a-zA-Z0-9]/g, "");
  }

  submitPointInput() {
    // get currently input points
    let points = 0;
    this.columns.forEach((column) => {
      let inputElem = document.getElementById(this.idSafe(`points_${column}`));
      points += parseInt(inputElem.value);
    });
    // add points to player
    this.player.score += points;
    // hide the point input table
    let pointInputTableElem = document.getElementById(this.#pointInputTableElemId);
    pointInputTableElem.style.display = "none";
    // end the current round
    this.endRound();
    this.drawGameUi();
  }

  drawPointInputTable() {
    // make visible
    let pointInputTableElem = document.getElementById(this.#pointInputTableElemId);
    pointInputTableElem.style.display = "";
    // clear
    pointInputTableElem.innerHTML = "";
    let tableBodyElem = pointInputTableElem.createTBody();
    // row with input fields
    let rowElem = tableBodyElem.insertRow();
    this.columns.forEach((column) => {
      let cellElem = rowElem.insertCell();
      let inputElem = document.createElement("input");
      inputElem.type = "text";
      inputElem.classList.add("input");
      inputElem.id = this.idSafe(`points_${column}`);
      cellElem.appendChild(inputElem);
    });
    // row with submit button
    rowElem = tableBodyElem.insertRow();
    let cellElem = rowElem.insertCell();
    cellElem.colSpan = this.columns.length;
    let submitButtonElem = document.createElement("button");
    submitButtonElem.classList.add("button");
    submitButtonElem.classList.add("input");
    submitButtonElem.classList.add("is-light");
    submitButtonElem.classList.add("is-success");
    submitButtonElem.textContent = "submit";
    cellElem.appendChild(submitButtonElem);
    // set event listener on submit button
    submitButtonElem.addEventListener("click", () => {
      this.submitPointInput();
    });
  }

  drawPlayUi(myPlayerName) {
    // draw the answer table
    let answerTableElem = document.getElementById(this.#gameAnswerTableElemId);
    // clear
    answerTableElem.innerHTML = "";
    // make table layout fixed
    answerTableElem.style.tableLayout = "fixed";
    // table head
    let answerTableHeadElem = answerTableElem.createTHead();
    let answerTableHeadRowElem = answerTableHeadElem.insertRow();
    this.columns.forEach((column) => {
      let answerTableHeadCellElem = document.createElement("th");
      answerTableHeadCellElem.innerHTML = column;
      answerTableHeadRowElem.appendChild(answerTableHeadCellElem);
    });
    // table body
    let answerTableBodyElem = answerTableElem.createTBody();
    // for each finished round
    this.rounds.filter((round) => round.finished).forEach((round) => {
      let answerTableBodyRowElem = answerTableBodyElem.insertRow();
      this.columns.forEach((column) => {
        // for each column
        let roundAnswers = round.answers.filter((answer) => answer.column == column);
        // add player's own answer to cell
        let myAnswer = roundAnswers.find((answer) => answer.player == myPlayerName);
        let answerTableBodyCellElem = answerTableBodyRowElem.insertCell();
        let myAnswerElem = document.createElement("p");
        if (myAnswer) {
          myAnswerElem.innerHTML = myAnswer.answer;
        }
        answerTableBodyCellElem.appendChild(myAnswerElem);
        // add indicator for order of answers from all players to cell
        let answerOrderElem = document.createElement("span");
        answerOrderElem.innerHTML = "&nbsp;"; // separator
        roundAnswers.forEach((answer) => {
          let answerOrderDotElem = document.createElement("span");
          answerOrderElem.appendChild(this.playerDotElement(answer.player));
        });
        myAnswerElem.appendChild(answerOrderElem);
      });
    });

    // draw the input table
    let inputTableElem = document.getElementById(this.#gameInputTableElemId);
    // // remember current input values and (dis)abled state of all columns
    // let currentInputValues = {};
    // let currentInputDisabled = {};
    // this.columns.forEach((column) => {
    //   let inputElem = document.getElementById(this.#gameInputTableElemId + "-" + this.idSafe(column));
    //   if (inputElem) {
    //     currentInputValues[column] = inputElem.value;
    //     currentInputDisabled[column] = inputElem.disabled;
    //   }
    // });
    // clear
    inputTableElem.innerHTML = "";
    // add input elements
    let inputTableBodyElem = inputTableElem.createTBody();
    let inputTableBodyRowElem = inputTableBodyElem.insertRow();
    this.columns.forEach((column) => {
      let inputTableBodyCellElem = inputTableBodyRowElem.insertCell();
      let inputElem = document.createElement("input");
      inputElem.id = this.#gameInputTableElemId + "-" + column;
      inputElem.type = "text";
      inputElem.classList.add('input');
      inputElem.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
          // add the answer to the current round
          this.addAnswer(myPlayerName, column, inputElem.value);
          // disable the input element
          inputElem.disabled = true;
        }
      });
      // // set previous input value and (dis)abled state if exists
      // let previousInputValue = currentInputValues[column];
      // if (previousInputValue) {
      //   inputElem.value = previousInputValue;
      // }
      // if (currentInputDisabled[column]) {
      //   inputElem.disabled = currentInputDisabled[column];
      // }
      inputTableBodyCellElem.appendChild(inputElem);
      // add dif for indicators of other players that already answered
      let inputTableDotsElem = document.createElement("div");
      inputTableDotsElem.id = this.#gameInputTableElemId + "-" + this.idSafe(column) + "-dots";
      inputTableBodyCellElem.appendChild(inputTableDotsElem);
      // let currentRound = this.getCurrentRound();
      // // if there is a current round
      // if (currentRound) {
      //   currentRound.answers.filter((answer) => answer.column == column).forEach((answer) => {
      //     inputTableDotsElem.appendChild(this.playerDotElement(answer.player));
      //   });
      // }
    });

    // draw the peer list
    let peerListElem = document.getElementById(this.#peerListElemId);
    // clear
    peerListElem.innerHTML = "";
    // fill
    this.players.forEach((player) => {
      let peerElem = document.createElement("p");
      peerElem.classList.add('level-item');
      peerElem.classList.add('has-text-centered');
      let peerDotElem = document.createElement("span");
      peerDotElem.innerHTML = "●&nbsp;";
      peerDotElem.style.color = player.color;
      peerElem.appendChild(peerDotElem);
      let peerNameElem = document.createElement("span");
      peerNameElem.innerHTML = player.name;
      peerElem.appendChild(peerNameElem);
      peerListElem.appendChild(peerElem);
    });
  }
}
