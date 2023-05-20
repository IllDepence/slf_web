/*
 * Stadt, Land, Fluss
 *
 * Class based implementation using ES6 features of the game state and logic.
 */


class Player {

  constructor(id, name, color, score = 0) {
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

  // server view element IDs
  #serverIdInputElemId = "serverId";
  #serverIdCopyElemId = "copyServerId";
  #serverPwInputElemId = "serverPw";
  #serverPwSetElemId = "serverPwSet";
  #gameColumnsInputElemId = "gameColumns";
  #gameColumnsSetElemId = "gameColumnsSet";
  #playerListElemId = "playerList";
  // player view element IDs
  #gameAnswerTableElemId = "gameAnswerTable";
  #gameInputTableElemId = "gameInputTable";
  #peerListElemId = "peerList";

  constructor(columns, players = [], rounds = [], serverID = null) {
    // basic setup with columns attribute being required
    this.columns = columns;
    this.players = players;
    this.rounds = rounds;
    this.serverID = serverID;
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

  getScoreCurrentRound(player) {
    return this.sumScore([this.getCurrentRound()]);
  }

  getTotalScore(player) {
    return this.sumScore(this.rounds);
  }

  renderServerSide() {
    // set the server ID
    document.getElementById(this.#serverIdInputElemId).value = this.serverID;
    // initialize server ID copy button
    document.getElementById(this.#serverIdCopyElemId).addEventListener("click", () => {
      navigator.clipboard.writeText(this.serverID);
    }

    // set the server password
    document.getElementById(this.#serverPwInputElemId).value = this.serverPW;
    // initialize server password set button
    document.getElementById(this.#serverPwSetElemId).addEventListener("click", () => {
      // set the server password
      this.serverPW = document.getElementById(this.#serverPwInputElemId).value;
      // deactivate the button
      document.getElementById(this.#serverPwSetElemId).disabled = true;
      // make the input field read-only
      document.getElementById(this.#serverPwInputElemId).readOnly = true;
    }

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
    }
  }

  renderPlayerSide(myPlayerName) {
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
    }
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
        }
        answerTableBodyCellElem.appendChild(answerOrderElem);
      }
    }

    // draw the input table
    let inputTableElem = document.getElementById(this.#gameInputTableElemId);
    // clear
    inputTableElem.innerHTML = "";
    // add a single table row with input elements which, when the player hits enter, add the answer to the current round
    // and disable the input element for that specific column
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
      }
      inputTableBodyCellElem.appendChild(inputElem);
    }

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
    }
  }
}
