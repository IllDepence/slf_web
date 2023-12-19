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

  addAnswer(player, column, answer, score = null) {
    this.answers.push(new Answer(player, column, answer, score));
  }

  assignScoreToAnswer(player, column, score) {
    // assign score to current round answer of player for column
    this.answers.forEach(function (answer) {
      if (answer.player.name === player.name && answer.column === column) {
        answer.score = score;
      }
    });
  }

}

class Game {

  // global element IDs
  #redrawUiMenuButtonElemId = "redrawUiMenuButton";
  #resetGameMenuButtonElemId = "resetGameMenuButton";
  #resetGameButtonElemId = "resetGameButton";
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
  #serverCtrlElemId = "serverCtrlCol";
  #serverCtrlFoldedElemId = "serverCtrlFoldedCol";
  #serverCtrlFoldElemId = "serverCtrlFold";
  #serverCtrlUnfoldElemId = "serverCtrlUnfold";
  // player view element IDs
  #playScreenElemId = "playScreen";
  #gameAnswerTableElemId = "gameAnswerTable";
  #gameInputTableElemId = "gameInputTable";
  #pointInputTableElemId = "pointInputTable";
  #peerListElemId = "peerList";

  constructor(
    columns = [],
    players = [],
    player = null,
    rounds = [],
    serverId = null,
    serverPw = null,
    serverConn = null,
    peerJsObj = null,
  ) {
    this.columns = columns;
    // about this.players:
    // if we're server, we maintain this list
    // if we're player, we don't touch this list, only update on server messages
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

  /* - - - - - - - helper functions - - - - - - - */

  idSafe(str) {
    // helper function to make a string safe for use in HTML element IDs
    return str.replace(/[^a-zA-Z0-9]/g, "");
  }

  requirePositiveInt(event) {
    /* event listener for input fields to only allow positive numbers */

    // check with input contains any non-digit characters
    // and if so, remove them
    event.target.value = event.target.value.replace(/\D/g, '');
  }

  /* - - - - - - - UI - - - - - - - */

  setUiEventListeners() {
    document.getElementById(this.#redrawUiMenuButtonElemId).addEventListener('click', () => {
      this.drawGameUi();
    });
    document.getElementById(this.#resetGameMenuButtonElemId).addEventListener('click', () => {
      this.resetGame();
    });
    document.getElementById(this.#initHostButtonElemId).addEventListener('click', () => {
      this.setUiState("host");
    });
    document.getElementById(this.#initPlayButtonElemId).addEventListener('click', () => {
      this.setUiState("chooseName");
    });
    document.getElementById(this.#serverCtrlFoldElemId).addEventListener('click', () => {
      document.getElementById(this.#serverCtrlElemId).style.display = "none";
      document.getElementById(this.#serverCtrlFoldedElemId).style.display = "";
    });
    document.getElementById(this.#serverCtrlUnfoldElemId).addEventListener('click', () => {
      document.getElementById(this.#serverCtrlElemId).style.display = "";
      document.getElementById(this.#serverCtrlFoldedElemId).style.display = "none";
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

  playerDotElement(player, pre = '', post = '') {
    let dotSpan = document.createElement("span");
    dotSpan.innerHTML = pre + "●" + post;
    dotSpan.style.color = player.color;
    // if it's our dot give it a decorative border
    if (this.uiState == "play" && player.name == this.player.name) {
      dotSpan.style.borderRadius = "30%";
      dotSpan.style.border = "2px solid " + player.color;
    }
    return dotSpan;
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

  clearDotIndicators() {
    let dotIndicatorDivs = document.getElementsByClassName("dot-indicator");
    for (let dotIndicatorDiv of dotIndicatorDivs) {
      dotIndicatorDiv.innerHTML = "";
    }
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
      this.drawPlayUi();
    }
  }

  drawServerUi() {
    this.serverId = this.peerJsObj.id;
    // show the server ID if game columns are set
    if (this.gameColumns != null && this.gameColumns.length > 0) {
      document.getElementById(this.#serverIdInputElemId).value = this.serverId;
    }
    // initialize server ID copy button
    document.getElementById(this.#serverIdCopyElemId).addEventListener("click", () => {
      // copy to clipboard (compatible with Firefox, Chrome, Chromium, Safari, Edge)
      let dummy = document.createElement("textarea");
      document.body.appendChild(dummy);
      dummy.value = this.serverId;
      dummy.select();
      document.execCommand("copy");
      document.body.removeChild(dummy);
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
      // calculate the player score based on the their answers in all finished rounds
      let playerScore = 0;
      this.rounds.filter((round) => round.finished).forEach((round) => {
        // go through, column by column
        let playerAnswerScoresRanks = []; // array of (<a_score>, <a_rank>) tuples
        this.columns.forEach((column) => {
          // get answers for the current column that have a score > 0 (don't want to
          // assign answers a lower rank only b/c they were given later than a wrong
          // answer)
          let validCellAnswers = round.answers.filter(
            (answer) => answer.column == column && answer.score != null && answer.score > 0
          );  // FIXME: check if this works or not
          // (old comment read “this does not work right now b/c
          //  players don’t communicate their scores”, but given
          //  some brief testing in the UI it seems to work)
          for (let i = 0; i < validCellAnswers.length; i++) {
            let answer = validCellAnswers[i];
            if (answer.player.id == player.id) {
              playerAnswerScoresRanks.push([answer.score, i + 1]);
            }
          }
        });
        // add up all the answer scores in playerAnswerScoresRanks to get the round score
        let roundScore = playerAnswerScoresRanks.reduce((sum, tup) => sum + tup[0], 0);
        let roundBonusPointsWithExplanation = this.calcRoundBonusPoints(
          playerAnswerScoresRanks, this.players.length, this.columns.length
        );
        playerScore += roundScore + roundBonusPointsWithExplanation.points;
      });
      row.insertCell().innerHTML = playerScore;
    });
  }

  drawPlayUi() {
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
    // add a score column
    let answerTableHeadCellElem = document.createElement("th");
    answerTableHeadCellElem.innerHTML = "P";
    answerTableHeadRowElem.appendChild(answerTableHeadCellElem);
    // table body
    let answerTableBodyElem = answerTableElem.createTBody();
    // for each finished round
    let finishedRounds = this.rounds.filter((round) => round.finished);
    finishedRounds.forEach((round, idx, finishedRounds) => {
      let answerTableBodyRowElem = answerTableBodyElem.insertRow();
      let playerAnswerScoresRanks = []; // array of (<a_score>, <a_rank>) tuples
      // iterate over columns
      this.columns.forEach((column) => {
        // get answers for the current column that have a score > 0 (don't want to
        // assign answers a lower rank only b/c they were given later than a wrong
        // answer)
        let myAnswer = '';
        let cellAnswers = round.answers.filter(
          (answer) => answer.column == column
        );
        let validCellAnswers = cellAnswers.filter(
          (answer) => answer.score != null && answer.score > 0
        );
        let foundMyAnswer = false;
        for (let i = 0; i < validCellAnswers.length; i++) {
          let answer = validCellAnswers[i];
          if (answer.player.id == this.player.id) {
            foundMyAnswer = true;
            // take note of score and rank
            playerAnswerScoresRanks.push([answer.score, i + 1]);
            // take note of players answer
            myAnswer = answer;
          }
        }
        // if no valid answer was found, add a placeholder
        if (!foundMyAnswer) {
          playerAnswerScoresRanks.push([0, null]);
        }
        // add answer to the table
        let answerTableBodyCellElem = answerTableBodyRowElem.insertCell();
        let myAnswerElem = document.createElement("p");
        if (myAnswer) {
          myAnswerElem.innerHTML = myAnswer.answer;
        }
        answerTableBodyCellElem.appendChild(myAnswerElem);
        // add indicator for order of answers from all players to cell
        let answerOrderElem = document.createElement("span");
        answerOrderElem.innerHTML = "&nbsp;"; // separator
        cellAnswers.forEach((answer) => {
          let answerOrderDotElem = document.createElement("span");
          answerOrderElem.appendChild(this.playerDotElement(answer.player));
        });
        myAnswerElem.appendChild(answerOrderElem);
      });
      // calculate score for the table row
      let roundScore = playerAnswerScoresRanks.reduce((sum, tup) => sum + tup[0], 0);
      let roundBonusPointsWithExplanation = this.calcRoundBonusPoints(
        playerAnswerScoresRanks, this.players.length, this.columns.length
      );
      let roundBonusPoints = roundBonusPointsWithExplanation.points;
      let roundBonusPointsExplanation = roundBonusPointsWithExplanation.explanation;
      let displayScore = null;
      if (idx + 1 === finishedRounds.length) {
        // bonus score can only be calculated for rounds for which we have the scores
        // of all players. this is not the case for the last round over which we
        // iterate here
        displayScore = `(${roundScore})`
      }
      else {
        displayScore = `<span title="${roundBonusPointsExplanation}">${roundScore + roundBonusPoints}</span>`;
      }
      // add table cell with the score
      let scoreCellElem = answerTableBodyRowElem.insertCell();
      scoreCellElem.innerHTML = displayScore;
    });

    // draw the input table
    let inputTableElem = document.getElementById(this.#gameInputTableElemId);
    inputTableElem.style.tableLayout = "fixed";
    inputTableElem.innerHTML = "";
    // add input elements
    let inputTableBodyElem = inputTableElem.createTBody();
    let inputTableBodyRowElem = inputTableBodyElem.insertRow();
    this.columns.forEach((column) => {
      let inputTableBodyCellElem = inputTableBodyRowElem.insertCell();
      let inputElem = document.createElement("input");
      inputElem.id = this.#gameInputTableElemId + "-" + column;
      inputElem.tabIndex = this.columns.indexOf(column) + 1;
      inputElem.type = "text";
      inputElem.classList.add('input');
      inputElem.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
          // add the answer to the current round
          this.addAnswer(this.player, column, inputElem.value);
          // disable the input element
          inputElem.disabled = true;
          // jump to the next input element that is not disabled
          let nextColumn = null;
          for (let i = 0; i < this.columns.length; i++) {
            let nextColumnIdx = (this.columns.indexOf(column) + 1 + i) % this.columns.length;
            let nextColumn = this.columns[nextColumnIdx];
            let nextInputElem = document.getElementById(this.#gameInputTableElemId + "-" + nextColumn);
            if (!nextInputElem.disabled) {
              nextInputElem.focus();
              break;
            }
          }
        }
      });
      inputTableBodyCellElem.appendChild(inputElem);
      // add div for indicators of other players that already answered
      let inputTableDotsElem = document.createElement("div");
      inputTableDotsElem.id = this.#gameInputTableElemId + "-" + this.idSafe(column) + "-dots";
      inputTableDotsElem.classList.add('dot-indicator');
      inputTableBodyCellElem.appendChild(inputTableDotsElem);
    });
    // add one fill cell to compensate for the score column in the answer table
    // the filler cell contains an invisible input element to make sure it has the correct size
    let fillerCellElem = inputTableBodyRowElem.insertCell();
    // let fillerInputElem = document.createElement("input");
    // fillerInputElem.type = "text";
    // fillerInputElem.style.visibility = "hidden";
    // fillerCellElem.appendChild(fillerInputElem);

    // draw the peer list
    let peerListElem = document.getElementById(this.#peerListElemId);
    // clear
    peerListElem.innerHTML = "";
    // fill
    this.players.forEach((player) => {
      let peerElem = document.createElement("p");
      peerElem.classList.add('level-item');
      peerElem.classList.add('has-text-centered');
      let peerDotElem = this.playerDotElement(player);
      peerElem.appendChild(peerDotElem);
      let peerNameElem = document.createElement("span");
      peerNameElem.innerHTML = "&nbsp;" + player.name;
      peerElem.appendChild(peerNameElem);
      peerListElem.appendChild(peerElem);
    });
  }


  drawPointInputTable() {
    // make visible
    let pointInputTableElem = document.getElementById(this.#pointInputTableElemId);
    pointInputTableElem.style.display = "";
    // clear
    pointInputTableElem.innerHTML = "";
    let tableBodyElem = pointInputTableElem.createTBody();
    // row with header ("scores")
    let rowElem = tableBodyElem.insertRow();
    let headerCellElem = rowElem.insertCell();
    headerCellElem.innerHTML = "<strong>scores</strong>";
    headerCellElem.classList.add("has-text-centered");
    headerCellElem.colSpan = this.columns.length;
    rowElem.insertCell(); // empty cell to compensate for the score column
    // row with input fields
    rowElem = tableBodyElem.insertRow();
    this.columns.forEach((column) => {
      let cellElem = rowElem.insertCell();
      let inputElem = document.createElement("input");
      inputElem.type = "text";
      inputElem.classList.add("input");
      inputElem.id = this.idSafe(`points_${column}`);
      // set requirePositiveInt as event listener on input
      inputElem.addEventListener("keyup", (event) => {
        this.requirePositiveInt(event);
      });
      cellElem.appendChild(inputElem);
    });
    // add one empty cell to compensate for the score column in the answer table
    rowElem.insertCell();
    // row with submit button
    rowElem = tableBodyElem.insertRow();
    let cellElem = rowElem.insertCell();
    cellElem.colSpan = this.columns.length;
    let submitButtonElem = document.createElement("button");
    submitButtonElem.classList.add("button");
    submitButtonElem.classList.add("input");
    submitButtonElem.classList.add("is-light");
    submitButtonElem.classList.add("is-success");
    submitButtonElem.textContent = "submit scores";
    cellElem.appendChild(submitButtonElem);
    // set event listener on submit button
    submitButtonElem.addEventListener("click", () => {
      this.submitPointInput();
    });
    // empty cell (see above)
    cellElem = rowElem.insertCell();
  }

  /* - - - - - - - game logic - - - - - - - */

  getCurrentRound() {
    // if there is no non-finished round, start a new one
    if (this.rounds.length === 0 || this.rounds[this.rounds.length - 1].finished) {
      this.startRound();
    }
    // return the current round
    return this.rounds[this.rounds.length - 1];
  }

  getLastFinishedRound() {
    // get to most recently ended round (to add scores to answers)
    let lastFinishedRound = null;
    for (let i = this.rounds.length - 1; i >= 0; i--) {
      if (this.rounds[i].finished) {
        lastFinishedRound = this.rounds[i];
        break;
      }
    }
    return lastFinishedRound;
  }

  getLastAnsweredRound(){
    // get the most recent round that we (the player) added a full
    // set of answers to, regardless of whether is round was already
    // scored/ended or not

    // make sure we're in play mode
    if (this.uiState !== "play") {
      console.error(`getLastAnsweredRound() called in mode ${this.uiState}`);
      return null;
    }
    let lastAnswered = null
    for (let i = this.rounds.length - 1; i >= 0; i--) {
      if (this.answeredAll(this.rounds[i])) {
        lastAnswered = this.rounds[i];
        break;
      }
    }
    return lastAnswered;
  }

  startRound(letter) {
    // start a new round with a given letter
    this.rounds.push(new Round(letter));
  }

  endRound() {
    // end the current round
    this.getCurrentRound().end();
  }

  addPlayer(player) {
    console.log("adding player", player);
    this.players.push(player);
  }

  answeredAll(round) {
    // check if we have answered all columns
    return round.answers.filter(
      (answer) => answer.player.id === this.player.id
    ).length === this.columns.length;
  }

  calcRankFactor(rank, numPlayers) {
    // calculate a factor with diminishing returns for a “rank” in
    // as list of player answers from first answer to last answer

    // if rank is null, return 0
    if (rank === null) {
      return 0;
    }

    // player rank mapped to range [1, 0]
    let zeroBasedRank = rank - 1;
    let rankOneToZero = (numPlayers - zeroBasedRank) / numPlayers;

    // set everything below 0.5 to 0
    let rankOneToHalf = rankOneToZero > 0.5 ? rankOneToZero : 0;

    // square for diminishing returns
    let rankFactor = Math.pow(rankOneToHalf, Math.E);

    return rankFactor;
  }

  calcRoundBonusPoints(scoreRankTuples, numPlayers, numCols) {
    // calculate the bonus points a player gets in a round based on
    // a list of (<answer_score>, <answer_rank>) tuples and the
    // number of players in the game

    let bonusExplanation = "Bonus point calculation:\n";
    let ret = {
      points: 0,
      explanation: bonusExplanation,
    };

    if (scoreRankTuples.length === 0) {
      ret.explanation += "-";
      return ret;
    }

    let fullRoundScore = numCols * 10;
    let factorSum = 0;
    let factors = [];

    // iterate over answers
    for (let i = 0; i < scoreRankTuples.length; i++) {
      let score = scoreRankTuples[i][0];
      let rank = scoreRankTuples[i][1];

      // get answer rank factor
      // - #1 -> 1.0     1.0
      // - #2 -> 0.545   0.457
      // - #3 -> 0.249   0.0
      // - #4 -> 0.0     0.0
      // - #5 -> 0.0
      let rankFac = this.calcRankFactor(rank, numPlayers);

      // calculate score factor
      // - 20 -> 1
      // - 10 -> 1
      // -  5 -> 0.125
      // -  0 -> 0
      let scoreFac = Math.pow((Math.min(score, 10) / 10), 3);

      // add up
      // - all #1 w/ 10p -> number of columns
      // - all #1 w/  5p -> 1/8th of num of cols
      factorSum += rankFac * scoreFac;
      // keep track of factors (for explanability)
      factors.push([rankFac, scoreFac]);
    }

    // bonus factor is above sum (in the range of <num_cols>, 0)
    // divided by the number of columns squared
    // - all #1 w/ 10p -> 1
    // - all #1 w/  5p -> 0.125
    let bonusFac = Math.pow((factorSum / numCols), 2);

    // bonus points are an added full round score in the ideal case
    // but fall off quickly with fewer unique answers/higher ranks
    let bonusPoints = fullRoundScore * bonusFac

    // round to integer
    bonusPoints = Math.round(bonusPoints);

    // build explanation
    // we start of with shwoing how the sum of bonus factors got calculated
    // format: "Σ( [<rankFac>, <scoreFac>], ... ) = <factorSum>"
    bonusExplanation += "Σ(\n";
    for (let i = 0; i < factors.length; i++) {
      // render the score factor as 1, ⅛, or 0
      let scoreFacTextDict = {
        1: "1",
        0.125: "⅛",
        0: "0",
      };
      let scoreFacText = scoreFacTextDict[factors[i][1]];
      bonusExplanation += `   [${factors[i][0].toFixed(3)}, ${scoreFacText}]\n`;
    }
    bonusExplanation += `) = ${factorSum.toFixed(3)}\n`;
    // next we show the division by the number of columns squared
    // format: "(<factorSum> / <numCols>)² = <bonusFac>"
    bonusExplanation += `(${factorSum.toFixed(3)} / ${numCols})² = ${bonusFac.toFixed(3)}\n`;
    // next we show the multiplication with the full round score to the power of 2
    // format: "(<bonusFac> × <fullRoundScore>)² = <bonusPoints>"
    bonusExplanation += `${bonusFac.toFixed(3)} × ${fullRoundScore} ≈ ${bonusPoints}\n`;

    ret.points = bonusPoints;
    ret.explanation = bonusExplanation;

    return ret;
  }

  addAnswer(player, column, answer) {
    // add answer to current round in local game state
    this.getCurrentRound().addAnswer(player, column, answer);
    // if we're a player
    if (this.uiState == 'play') {
      // send single answer to server
      this.sendSingleAnswerToServer(player, column, answer);
      // if the player gave an answer for every column, draw the point input table
      if (this.uiState == 'play' && this.answeredAll(this.getCurrentRound())) {
        this.drawPointInputTable();
      }
    }
  }

  isPlayerKnown(player) {
    // check if a player is already in the list of players
    return this.players.some((p) => p.name == player.name && p.id == player.id);
  }

  submitPointInput() {
    // get currently input answer scores
    let roundScores = [];
    this.columns.forEach((column) => {
      let inputElem = document.getElementById(this.idSafe(`points_${column}`));
      let answerScore = parseInt(inputElem.value);
      // set to 0 if NaN
      if (isNaN(answerScore)) {
        answerScore = 0;
      }
      roundScores.push({
        column: column,
        score: answerScore
      });
      // assign score to the answer
      this.getCurrentRound().assignScoreToAnswer(
        this.player,
        column,
        answerScore
      );
    });
    // clear dot indicators
    this.clearDotIndicators();
    // hide the point input table
    let pointInputTableElem = document.getElementById(this.#pointInputTableElemId);
    pointInputTableElem.style.display = "none";
    // send server signal to end round
    this.sendEndRoundSignalToServer();
    // send roundScores using this.sendRoundScoresToServer
    // send with a timeout of 250 ms to make sure the endRoundSignal arrives first
    setTimeout(() => {
      this.sendRoundScoresToServer(roundScores);
    }, 250);
    // end the current round locally
    this.endRound();
    this.drawGameUi();
  }

  resetGame() {
    // re-enables the column input and adds a reset game button
    // which when clicked removes all rounds and sends the
    // new columns to the players

    // if we’re not in host mode, do nothing
    if (this.uiState != 'host') {
      return;
    }
    // re-enable column input
    let gameColumnsInput = document.getElementById(this.#gameColumnsInputElemId);
    gameColumnsInput.disabled = false;
    let gameColumnsSet = document.getElementById(this.#gameColumnsSetElemId);
    gameColumnsSet.classList.add('is-warning');
    gameColumnsSet.innerText = "Update Columns";
    // add new button to push reset game state to players
    let parentElem = gameColumnsSet.parentElement;
    let resetGameButton = document.createElement('button');
    resetGameButton.id = this.#resetGameButtonElemId;
    resetGameButton.classList.add('button');
    resetGameButton.classList.add('is-danger');
    resetGameButton.innerText = "Reset Game";
    resetGameButton.addEventListener('click', () => {
      // remove all rounds
      this.rounds = [];
      // propagate game state to players
      this.sendGameStateToPlayers();
      // remove reset button
      let resetGameButton = document.getElementById(this.#resetGameButtonElemId);
      resetGameButton.remove();
      // re-draw game UI
      this.drawGameUi();
    });
    parentElem.insertAdjacentElement('beforeend', resetGameButton);
  }


  /* - - - - - - - network > general - - - - - - - */

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
    // single answer message
    else if (messageType == "singleAnswer") {
      if (this.uiState == "host") {
        // add answer to current round
        this.addAnswer(data.payload.player, data.payload.column, data.payload.answer);
        // propagate current state of current round to all players
        this.sendCurrentRoundUpdateToPlayers();
      }
      else if (this.uiState == "play") {
        // we're not supposed to get these
        console.log('received single answer message in play mode');
        console.log('this should not happen');
        console.log(data);
      }
    }
    // current round update message
    else if (messageType == "currentRoundUpdate") {
      if (this.uiState == "host") {
        // we're not supposed to get these
        console.log('received current round update message in host mode');
        console.log('this should not happen');
        console.log(data);
      }
      else if (this.uiState == "play") {
        this.handleCurrentRoundUpdate(data.payload.answers);
      }
    }
    // end round message from client
    else if (messageType == "endRound") {
      if (this.uiState == "host") {
        this.endRoundByPlayerSignal();
      }
      else if (this.uiState == "play") {
        // we're not supposed to get these
        console.log('received end round message in play mode');
        console.log('this should not happen');
        console.log(data);
      }
    }
    // round scores message
    else if (messageType == "roundScores") {
      // handle regardless of being host or client
      // (diffenentiation is done in method below)
      this.handleRoundScoresUpdate(data);
    }
  }

  /* - - - - - - - network > client - - - - - - - */

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

  singleAnswerMessage(column, answer) {
    return {
      type: "singleAnswer",
      payload: {
        player: this.player,
        column: column,
        answer: answer
      }
    };
  }

  sendSingleAnswerToServer(player, column, answer) {
    // assert that we are in play mode
    if (this.uiState != "play") {
      console.log('not in play mode, not sending single answer dot to server');
      return;
    }
    // send the single answer dot to the server
    console.log('sending single answer to server');
    this.serverConn.send(this.singleAnswerMessage(column, answer));
  }

  handleCurrentRoundUpdate(answers) {
    console.log('updating current round with answers');
    // update the current round with the answers
    this.getCurrentRound().answers = answers;
    // clear all dot indicator divs
    this.clearDotIndicators();
    // update dot indicators
    for (let answer of answers) {
      let column = answer.column;
      let player = answer.player;
      // put player's answer dot in the column
      let dotsDivId = this.#gameInputTableElemId + "-" + this.idSafe(column) + "-dots";
      let dotsDiv = document.getElementById(dotsDivId);
      dotsDiv.appendChild(this.playerDotElement(player));
    }
  }

  sendEndRoundSignalToServer() {
    this.serverConn.send({
      type: "endRound",
      payload: {}
    });
  }

  sendRoundScoresToServer(roundScores) {
    this.serverConn.send({
      type: "roundScores",
      payload: {
        player: this.player,
        roundScores: roundScores
      }
    });
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

  /* - - - - - - - network > server - - - - - - - */

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

  handleRoundScoresUpdate(data) {
    // handle message from player sent at the end of a round
    // (contains scores for their answers of the round)
    console.log('handling round scores update by player');
    let player = data.payload.player;
    let roundScores = data.payload.roundScores;
    let scoreUpdateRound = null;
    if (this.uiState == "host") {
      // if we're host, the round to asign the scores to
      // should be finished b/c the end round signal is
      // sent before the score update message
      scoreUpdateRound = this.getLastFinishedRound();
    }
    else if (this.uiState == "play") {
      // if we're a player, we need to get the last round
      // for which we assigned a full set of answers,
      // regardless of whether we already scored and ended
      // it on our side
      scoreUpdateRound = this.getLastAnsweredRound();
    }
    for (let roundScore of roundScores) {
      // assign the score to the corresponding answers
      scoreUpdateRound.assignScoreToAnswer(
        player,
        roundScore.column,
        roundScore.score
      );
    }
    if (this.uiState == "host") {
      // send round scores message to all players
      this.sendMessageToPlayers(data);
      this.drawGameUi();
    }
  }

  currentRoundUpdateMessage() {
    return {
      type: "currentRoundUpdate",
      payload: {
        answers: this.getCurrentRound().answers
      }
    };
  }

  sendCurrentRoundUpdateToPlayers() {
    this.sendMessageToPlayers(this.currentRoundUpdateMessage());
  }

  getPlayerByPeerId(peerId) {
    // get the player object corresponding to a peerJS ID
    return this.players.find((p) => p.id == peerId);
  }

  sendGameStateToPlayers() {
    this.sendMessageToPlayers(this.updateGameStateMessage());
  }

  endRoundByPlayerSignal() {
    console.log('received end round signal from player');
    // check if current round has answers
    if (this.getCurrentRound().answers.length == 0) {
      // if not, we can assume that we already ended the round in question
      console.log('round already ended. ignoring signal');
      return;
    }
    console.log('ending round');
    this.endRound();
  }

}
