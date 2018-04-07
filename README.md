<a name="Fembot"></a>

## Fembot
**Kind**: global class  

* [Fembot](#Fembot)
    * [.messageHandler()](#Fembot+messageHandler)
    * [.sendMessage(channelID, botMessage)](#Fembot+sendMessage)
    * [.rollDice(user, channelID, commands)](#Fembot+rollDice)
    * [.dkpCommands(user, channelID, message)](#Fembot+dkpCommands)
    * [.dkpList(channelID)](#Fembot+dkpList)
    * [.dkpDice(user, channelID, commands)](#Fembot+dkpDice)
    * [.dkpUserIndex(username)](#Fembot+dkpUserIndex) ⇒ <code>number</code>
    * [.dkpAllotment(currentUser, channelID, command)](#Fembot+dkpAllotment)
    * [.dkpSave()](#Fembot+dkpSave)
    * [.dkpCommandsTemplate()](#Fembot+dkpCommandsTemplate) ⇒ <code>string</code>

<a name="Fembot+messageHandler"></a>

### fembot.messageHandler()
registers everything that starts with !

**Kind**: instance method of [<code>Fembot</code>](#Fembot)  
<a name="Fembot+sendMessage"></a>

### fembot.sendMessage(channelID, botMessage)
sends message

**Kind**: instance method of [<code>Fembot</code>](#Fembot)  

| Param | Type | Description |
| --- | --- | --- |
| channelID | <code>any</code> | the channelID of where the commands was typed |
| botMessage | <code>string</code> | the message the bot should write |

<a name="Fembot+rollDice"></a>

### fembot.rollDice(user, channelID, commands)
basic !roll command 1-100

**Kind**: instance method of [<code>Fembot</code>](#Fembot)  

| Param | Type | Description |
| --- | --- | --- |
| user | <code>any</code> | the user playing |
| channelID | <code>any</code> | the channelID of where the commands was typed |
| commands | <code>any</code> | the full command after !dkp |

<a name="Fembot+dkpCommands"></a>

### fembot.dkpCommands(user, channelID, message)
runs the methods depending on commands given

**Kind**: instance method of [<code>Fembot</code>](#Fembot)  

| Param | Type | Description |
| --- | --- | --- |
| user | <code>any</code> | the user playing |
| channelID | <code>any</code> | the channelID of where the commands was typed |
| message | <code>any</code> | the full command (message) |

<a name="Fembot+dkpList"></a>

### fembot.dkpList(channelID)
prints the current users and their DKP

**Kind**: instance method of [<code>Fembot</code>](#Fembot)  

| Param | Type | Description |
| --- | --- | --- |
| channelID | <code>any</code> | the channelID of where the commands was typed |

<a name="Fembot+dkpDice"></a>

### fembot.dkpDice(user, channelID, commands)
roll dice game of High/Low/7 (1/1/4*bet)

**Kind**: instance method of [<code>Fembot</code>](#Fembot)  

| Param | Type | Description |
| --- | --- | --- |
| user | <code>any</code> | the user playing |
| channelID | <code>any</code> | the channelID of where the commands was typed |
| commands | <code>any</code> | the full command after !dkp |

<a name="Fembot+dkpUserIndex"></a>

### fembot.dkpUserIndex(username) ⇒ <code>number</code>
Checks if the username supplied is in our jsonif not checks for the user on the server, and ifa matching username is found, we save the user to ourJSON and respond with the index, otherwise we return -1

**Kind**: instance method of [<code>Fembot</code>](#Fembot)  
**Returns**: <code>number</code> - index - -1 or the actual index  

| Param | Type | Description |
| --- | --- | --- |
| username | <code>any</code> | the username of the one we want the index for |

<a name="Fembot+dkpAllotment"></a>

### fembot.dkpAllotment(currentUser, channelID, command)
used to give or take DKP

**Kind**: instance method of [<code>Fembot</code>](#Fembot)  

| Param | Type | Description |
| --- | --- | --- |
| currentUser | <code>any</code> | the user that issued the command |
| channelID | <code>any</code> | the channelID of where the command was issued |
| command | <code>any</code> | should be all commands after "!dkp " |

<a name="Fembot+dkpSave"></a>

### fembot.dkpSave()
Saves the current user data with DKP scores

**Kind**: instance method of [<code>Fembot</code>](#Fembot)  
<a name="Fembot+dkpCommandsTemplate"></a>

### fembot.dkpCommandsTemplate() ⇒ <code>string</code>
Just a string template for the DKP commands to be called

**Kind**: instance method of [<code>Fembot</code>](#Fembot)  
**Returns**: <code>string</code> - botMessage - the whole message as a string  
