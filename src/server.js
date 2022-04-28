import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();
app.use(express.static(path.join(__dirname, '/build')));

app.use(bodyParser.json());

const withDB = async (operations, res) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });
        const db = client.db('capstone_database');
    
        await operations(db);
    
        client.close();
    } catch (error) {
        res.status(500).json({ message: 'Connection failed', error });
    }
}

app.get('/api/products/:name', async (req, res) => {
    withDB(async (db) => {
        const productName = req.params.name;

        const productInfo = await db.collection('products').findOne({ name: productName })
        res.status(200).json(productInfo);
    }, res);
})

app.post('/api/products/:name/like', async (req, res) => {
    withDB(async (db) => {
        const productName = req.params.name;
    
        const productInfo = await db.collection('products').findOne({ name: productName });
        await db.collection('products').updateOne({ name: productName }, {
            '$set': {
                likes: productInfo.likes + 1,
            },
        });
        const updateProductInfo = await db.collection('products').findOne({ name: productName });
    
        res.status(200).json(updateProductInfo );
    }, res);
});

app.post('/api/products/:name/post-comment', (req, res) => {
    const { userName, text } = req.body;
    const productName = req.params.name;

    withDB(async (db) => {
        const productInfo = await db.collection('products').findOne({ name: productName });
        await db.collection('products').updateOne({ name: productName }, {
            '$set': {
                comments: productInfo.comments.concat({ userName, text }),
            },
        });
        const updateProductInfo = await db.collection('products').findOne({ name: productName });

        res.status(200).json(updateProductInfo);
    }, res);
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
})

app.listen(8000, () => console.log('This server is listening on port 8000'));