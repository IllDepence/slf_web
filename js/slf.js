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

  constructor(player_name, column, answer, score = null) {
    this.player_name = player_name;
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

  constructor(letter, finished = false, answers = []) {
    this.letter = letter;
    this.finished = finished;
    this.answers = answers;
  }

  end() {
    this.finished = true;
  }

  addAnswer(player, column, answer) {
    this.answers.push(new Answer(player_name, column, answer));
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
  #peerListElemId = "peerList";

  constructor(columns = [], players = [], rounds = [], player = null, serverId = null, serverPw = null, peerJsObj = null) {
    this.columns = columns;
    this.players = players;
    this.rounds = rounds;
    this.player = player;
    this.serverId = serverId;
    this.serverPw = serverPw;
    this.peerJsObj = peerJsObj;
    // setup UI
    this.uiState = "start";
    document.addEventListener('DOMContentLoaded', () => {
      this.setUiEventListeners();
      this.drawBaseUi();
    });
  }

  updateState(columns, players, rounds) {
    // complete update of the game state
    this.columns = columns;
    this.players = players;
    this.rounds = rounds;
  }

  addPlayer(player) {
    this.players.push(player);
  }

  getCurrentRound() {
    // return the current round
    return this._rounds[this._rounds.length - 1];
  }

  startRound(letter) {
    // start a new round with a given letter
    this.rounds.push(new Round(letter));
  }

  endRound() {
    // end the current round
    this.getCurrentRound().end();
  }

  addAnswer(player, column, answer) {
    // add an answer to the current round
    this.getCurrentRound().addAnswer(player, column, answer);
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
  }

  drawGameUi() {
    // draws game UI in playing or hosting state
    // *also* ensures that we have peerJS set up

    // if we're either playing or hosting and the peerJsObj is not yet initialized
    if ((this.uiState == "play" || this.uiState == "host") && this.peerJsObj == null) {
      // setup peerJsObj and call this function again
      const peer = new Peer();
      // Get an ID for peer discovery
      peer.on('open', id => {
        this.peerJsObj = peer;
        this.drawGameUi();
      });
    }
    else {
      if (this.uiState == "play") {
        this.drawPlayUi(this.player);
      }
      else if (this.uiState == "host") {
        this.drawServerUi();
      }
    }
  }

  deactiveServerPwInputs() {
    // deactivate the button
    document.getElementById(this.#serverPwSetElemId).disabled = true;
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
    this.checkGameColumns(); // run prior to user input once
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
      row.insertCell().innerHTML = player.color;
      row.insertCell().innerHTML = player.name;
      row.insertCell().innerHTML = player.id;
      row.insertCell().innerHTML = player.score;
    });
  }

  drawPlayUi(myPlayerName) {
    // draw the answer table
    let answerTableElem = document.getElementById(this.#gameAnswerTableElemId);
    // clear
    answerTableElem.innerHTML = "";
    // table head
    let answerTableHeadElem = answerTableElem.createTHead();
    let answerTableHeadRowElem = answerTableHeadElem.insertRow();
    answerTableHeadRowElem.insertCell().innerHTML = "Letter";
    this.columns.forEach((column) => {
      answerTableHeadRowElem.insertCell().innerHTML = column;
    });
    // table body
    let answerTableBodyElem = answerTableElem.createTBody();
    this.rounds.forEach((round) => {
      // for each round
      let answerTableBodyRowElem = answerTableBodyElem.insertRow();
      answerTableBodyRowElem.insertCell().innerHTML = round.letter;
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
        let answerOrderElem = document.createElement("p");
        roundAnswers.forEach((answer) => {
          let answerOrderDotElem = document.createElement("span");
          answerOrderDotElem.innerHTML = "●";
          answerOrderDotElem.style.color = answer.player.color;
          answerOrderElem.appendChild(answerOrderDotElem);
        });
        answerTableBodyCellElem.appendChild(answerOrderElem);
      });
    });

    // draw the input table
    let inputTableElem = document.getElementById(this.#gameInputTableElemId);
    // clear
    inputTableElem.innerHTML = "";
    // add input elements
    let inputTableBodyElem = inputTableElem.createTBody();
    let inputTableBodyRowElem = inputTableBodyElem.insertRow();
    this.columns.forEach((column) => {
      let inputTableBodyCellElem = inputTableBodyRowElem.insertCell();
      let inputElem = document.createElement("input");
      inputElem.type = "text";
      inputElem.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
          // add the answer to the current round
          this.addAnswer(myPlayerName, column, inputElem.value);
          // disable the input element
          inputElem.disabled = true;
        }
      });
      inputTableBodyCellElem.appendChild(inputElem);
      // add indicator for other players that already answered
      let inputTableBodyCellDivElem = document.createElement("div");
      inputTableBodyCellElem.appendChild(inputTableBodyCellDivElem);
      this.getCurrentRound().answers.filter((answer) => answer.column == column).forEach((answer) => {
        let inputTableBodyCellDivDotElem = document.createElement("span");
        inputTableBodyCellDivDotElem.innerHTML = "●";
        inputTableBodyCellDivDotElem.style.color = answer.player.color;
        inputTableBodyCellDivElem.appendChild(inputTableBodyCellDivDotElem);
      });
    });

    // draw the peer list
    let peerListElem = document.getElementById(this.#peerListElemId);
    // clear
    peerListElem.innerHTML = "";
    // fill
    this.players.forEach((player) => {
      let peerElem = document.createElement("p");
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
