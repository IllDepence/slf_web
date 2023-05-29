# Stadt, Land, Fluss (web)

### TODO

* UX improvements
    * when answering (enter), automatically move focus to next available input
    * when scoring
        * make sure input text is numbers
        * move focus to the next column on enter and submit when all are entered
* functional improvements
    * ...

### Ideas

* columns with assigned score check/functions
    * change game.columns from a list of strings to a list of (`<column name>`, `<scoring function>`) tuples
    * in the server UI, let the user set one column after the other (new input once a column is defined)
        * input: column name (text input) and a scoring function (dropdown)
