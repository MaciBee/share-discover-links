const express = require('express');
const path = require('path');
const app = express();
const port = 3005;

app.get('/', (req, res) => {
res.send('ilovefkdjfakdjfakejfaejf');

});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
