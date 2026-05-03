---
type: resource_collection
content: ascii_art
version: 1.0
---

# ASCII Art Resources Archive

This document is designed for easy programmatic parsing by AI agents. It collects ASCII art resources, including inline examples and links to large internet repositories.

## 🤖 Agent Parsing Instructions
To filter and extract specific categories without reading the entire file:
1. Use regular expressions or string matching to find `<category name="[TARGET_CATEGORY]">`.
2. Extract the content until the closing `</category>` tag.
3. Within a category, individual pieces of art or links are wrapped in `<item name="[NAME]" type="[TYPE]">` tags.

### Available Categories:
- `repositories` (Links to external archives and databases)
- `animals`
- `plants`
- `objects`
- `characters`

---

## Resources

<category name="repositories">

<item name="ASCII Art Archive" type="website">
URL: https://www.asciiart.eu/
Description: One of the largest and most comprehensive online repositories of ASCII art, neatly categorized into animals, plants, objects, characters, and more.
</item>

<item name="16colo.rs" type="website">
URL: https://16colo.rs/
Description: An extensive archive primarily focusing on historical ANSI and ASCII art, particularly from BBS art packs.
</item>

<item name="GitHub ASCII Art Topic" type="github_topic">
URL: https://github.com/topics/asciiart
Description: A collection of open-source repositories on GitHub related to ASCII art, including generators, libraries, and art collections.
</item>

<item name="Christopher Johnson's ASCII Art Collection" type="website">
URL: https://chris.com/ascii/
Description: A classic and widely referenced collection of ASCII art curated over many years.
</item>

</category>


<category name="animals">

<item name="cat" type="inline_art">
```text
 /\_/\
( o.o )
 > ^ <
```
</item>

<item name="dog" type="inline_art">
```text
  __      _
o'')}____//
 `_/      )
 (_(_/-(_/
```
</item>

<item name="fish" type="inline_art">
```text
      /`·.¸
     /¸...¸`:·
 ¸.·´  ¸   `·.¸.·´)
: © ):´;      ¸  {
 `·.¸ `·  ¸.·´\`·¸)
     `\\´´\¸.·´
```
</item>

</category>


<category name="plants">

<item name="flower" type="inline_art">
```text
   _ _
  ( ` )
   ; ;
    |
   / \
```
</item>

<item name="pine_tree" type="inline_art">
```text
    /\
   /  \
  /____\
   /  \
  /____\
   /  \
  /____\
    ||
    ||
```
</item>

<item name="cactus" type="inline_art">
```text
   _  _
  | || | _
  | || || |
  | || || |
   \_  || |
     |  _/
     | |
     |_|
```
</item>

<item name="bonsai_tree" type="inline_art">
```text
        ,.,
       MMMM_    ,..,
         "_ "__"  _MM
  ..., __," --"  ,"MM\
 MM_ " " -- __,"
   "_\___,"     " "
      \ \ 
       \ \
       / /
      / / 
     //  
     ||  
   __||__ 
```
</item>

<item name="potted_fern" type="inline_art">
```text
     .    .
      )  (
    . \  / .
  .  \ \/ /  .
  \  / /\ \  /
   \/ /  \ \/
    \/____\/
     |____|
```
</item>

</category>


<category name="objects">

<item name="coffee_cup" type="inline_art">
```text
  ( (
   ) )
........
|      |]
\      /
 `----'
```
</item>

<item name="sword" type="inline_art">
```text
      o()xxxx[{::::::::::::::::::::::::::::::::::>
```
</item>

<item name="computer" type="inline_art">
```text
 +---------------+
 |               |
 |   > hello_    |
 |               |
 +---------------+
  |  |       |  |
  +--+-------+--+
```
</item>

<item name="guitar" type="inline_art">
<!-- Acoustic Guitar -->
```text

                                '&`
                                 #
                                 #
                                _#_
                               ( # )
                               / 0 \
                              ( === )
                               `---'       
```
</item>

<item name="piano" type="inline_art">
```text
   ______________________
  / ____________________ \
 / /_|_|_|_|_|_|_|_|_|_|\ \
/________________________\
 | |                  | |
 | |                  | |
```
</item>

<item name="chair" type="inline_art">
```text
    i______i
    I______I
    I      I
    I______I
   /      /I
  (______( I
  I I    I I
  I      I
```
</item>

<item name="bed" type="inline_art">
```text
      ||
      ||                   ||
   ||/||___                ||
   || /`   )____________||_/|
   ||/___ //_/_/_/_/_/_/||/ |
   ||(___)//_/_/_/_/_/_/||  |
   ||     |_|_|_|_|_|_|_|| /|
   ||     | | | | | | | ||/
   ||~~~~~~~~~~~~~~~~~~~||
   ||                   ||
```
</item>


<item name="original_drum_set_groove" type="inline_art">
<!-- Antigravity Original: A stylized drum kit -->
```text
        _|_     _|_
       /   \   /   \
      ( Cym ) ( Cym )
       \___/   \___/
    ___     ___     ___
   |Snr|   |Tom|   |Tom|
   '---'   '---'   '---'
        ___________
       /           \
      |   [BASS]    |
       \___________/
```
</item>

</category>


<category name="characters">

<item name="kirby_dancing" type="inline_art">
```text
 <('-'<) ^('-')^ (>'-')>
```
</item>

<item name="lenny_face" type="inline_art">
```text
 ( ͡° ͜ʖ ͡°)
```
</item>

<item name="shrug" type="inline_art">
```text
 ¯\_(ツ)_/¯
```
</item>

<item name="game_pet_dragon" type="inline_art">
```text
           ___====-_  _-====___
     _--^^^#####//      \\#####^^^--_
  _-^##########// (    ) \\##########^-_
 -############//  |\^^/|  \\############-
_/############//   (@::@)   \\############\_
/#############((     \\//     ))#############\
-###############\\    (oo)    //###############-
-#################\\  / "" \  //#################-
-###################\\/      \//###################-
_#/|##########/\######(   (   )######/\##########|\#_
|/ |#/\#/\#/\/  \#/\##\  |  |  /##/\#/  \/\#/\#/\#| \|
`  |/  V  V  `   V  \#\| |  | |/#/  V   '  V  V  \|  '
   `   `  `      `   / | |  | | \   '      '  '   '
                    (  | |  | |  )
                   __\ | |  | | /__
                  (vvv(VVV)(VVV)vvv)
```
</item>

<item name="game_pet_fox" type="inline_art">
```text
   /\   /\
  //\\_//\\     ____
  \_     _/    /   /
   / * * \    /^^^]
   \_\O/_/    [   ]
    /   \_    [   /
    \     \_  /  /
     [ [ /  \/ _/
    _[ [ \  /_/
```
</item>

<item name="original_pet_aero_fin" type="inline_art">
<!-- Antigravity Original: A floating sky-ray with trailing energy ribbons -->
```text
        _______
     .-'       '-.
    /   .-----.   \
   |   /       \   |
   |  |  (O)(O) |  |
    \  \       /  /
     '-'-------'-'
      /  / | \  \
     /  /  |  \  \
    ~  ~   |   ~  ~
```
</item>

<item name="original_pet_pixel_pal" type="inline_art">
<!-- Antigravity Original: A retro 8-bit blocky monster -->
```text
      [#######]
      [# O O #]
      [#  ^  #]
   ###[#######]###
   #  [#######]  #
   #  [#     #]  #
   #  [#     #]  #
      [#######]
      |#|   |#|
      |#|   |#|
```
</item>

</category>
