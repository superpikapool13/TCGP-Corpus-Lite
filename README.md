# TCG Pocket Corpus Lite

A small tool for comparing translation strings from <u>Pokémon Trading Card Game Pocket</u>, side by side across languages.

Visit **https://superpikapool13.github.io/TCGP-Corpus-Lite/**

## Translation files

Located in `locales/`, all files should share the same set of keys.

Currently, the following langauges are supported:
```
locales/
  ├─de_DE
  ├─en_US
  ├─fr_FR
  ├─es_ES
  ├─it_IT
  ├─ja_JP
  ├─ko_KR
  ├─pt_BR
  └─zh_TW
```
To change the list of languages, simply edit the `LANGUAGES` array near the top of the script in [`index.html`](../../tree/gh-pages/index.html).

## Running the comparison tool locally

The app itself lives on the `gh-pages` branch. To run it locally:

First, clone the repo:
(This command clones only the `gh-pages` branch.)
```shell
git clone -b gh-pages --single-branch "https://github.com/superpikapool13/TCGP-Corpus-Lite.git" TCGP_CL_local
```
Then change into your directory:
```bash
cd TCGP_CL_local
```
Then start a simple local sever. Example using Python:
```powershell
python3 -m http.server 8080
```
(Use `python3` on Linux/MacOS and `python` on Windows.)

Then open [`http://localhost:8080`](http://localhost:8080).

## Credits
* This frontend built by [SuperPikaPool13](https://github.com/superpikapool13)
* Locale files extracted by [SombrAbsol](https://github.com/SombrAbsol) for use by [Encyclopædiæ Pokémonis](https://www.encyclopaediae-pokemonis.org/)
* Inspired by [abcboy101](https://github.com/abcboy101)'s [Poké Corpus](https://abcboy101.github.io/poke-corpus/), a tool to query the text corpus of most Pokémon games

## License

CC BY-NC-SA 4.0 — See [LICENSE](LICENSE.md).


## AI policy

Usage for dataset training prohibited — See [NoAI](NOAI.md).
