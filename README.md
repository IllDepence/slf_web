# Stadt, Land, Fluss (web)

## TODO

* functional improvements
    * ...

## Ideas

* columns with assigned score check/functions
    * change game.columns from a list of strings to a list of (`<column name>`, `<scoring function>`) tuples
    * in the server UI, let the user set one column after the other (new input once a column is defined)
        * input: column name (text input) and a scoring function (dropdown)

## API based porperty retrieval

### Wikidata

* General
    * [browse](https://www.wikidata.org/)
    * [query w/ SPARQL](https://query.wikidata.org/)

#### Data coverage tests

##### Cities

* [City](https://www.wikidata.org/wiki/Q515): 9,100
    * w/ population: 5,995
* [also City](https://www.wikidata.org/wiki/Q15253706)?
* [City or town](https://www.wikidata.org/wiki/Q7930989): 1,284
    * w/ population: 1,341 (?!)
* [Municipality](https://www.wikidata.org/wiki/Q15284): 561
    * seems to be the transitive parent class of at least Germany cities
* [Human settlement](https://www.wikidata.org/wiki/Q486972): 569,669
    * w/ population: 75,476
    * w/ coordinate location: 436,697
    * w/ inception: 4,045
    * w/ elevation above sea level: 146,370
    * w/ area: 17.093
    * ~~w/ attribute “located in or next to body of water”: 1.236~~ seems very unreliable
    * 

**Query**

```
SELECT (COUNT(?city) AS ?count)
WHERE
{
  ?city wdt:P31 wd:Q486972.
  ?city wdt:P1082 ?population.
}
```
