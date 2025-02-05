const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const nodemailer = require('nodemailer'); 

const app = express();

app.use(cors());

app.use(express.json());

mongoose.connect('mongodb+srv://Kaviprabha:Prabha2006@prabha.bg2ze.mongodb.net/test?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const User = mongoose.model('User', UserSchema);

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        console.log('New user details:', username, password);

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        console.log('User registered successfully');
        res.status(200).json({ message: 'Registration successful' });
    } catch (err) {
        console.error('Error during registration:', err);
        res.status(500).json({ message: 'Registration failed' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        console.log('Entered password:', password);
        console.log('Stored hashed password:', user.password);

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        res.status(200).json({ message: 'Login successful' });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ message: 'Login failed' });
    }
});
const SubscriberSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true }
});

const Subscriber = mongoose.model('Subscriber', SubscriberSchema);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'kaviprabha142@gmail.com',
        pass: 'jsoe gppr adxt sivm'
    }
});


app.post('/subscribe', async (req, res) => {
    const { email } = req.body;

    try {
        const existingSubscriber = await Subscriber.findOne({ email });

        if (existingSubscriber) {
            return res.status(400).json({ message: 'Email is already subscribed' });
        }

        const newSubscriber = new Subscriber({ email });
        await newSubscriber.save();

        const mailOptions = {
            from: 'kaviprabha142@gmail.com',
            to: email,
            subject: 'Subscription Confirmation',
            text: `Thanks for subscribing to Blog Diaries!!! . You will receive regular updates from us.`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ message: 'Error sending email' });
            }
            console.log('Subscription email sent:', info.response);
            res.status(200).json({ message: `Subscription successful! Confirmation email sent to ${email}` });
        });
    } catch (err) {
        console.error('Error subscribing:', err);
        res.status(500).json({ message: 'Subscription failed. Please try again later.' });
    }
});

app.post('/unsubscribe', async (req, res) => {
    const { email } = req.body;

    try {
        const subscriber = await Subscriber.findOne({ email });

        if (!subscriber) {
            return res.status(400).json({ message: 'Email is not subscribed' });
        }

        await Subscriber.deleteOne({ email });

        const mailOptions = {
            from: 'kaviprabha142@gmail.com',
            to: email,
            subject: 'Unsubscription Confirmation',
            text: `You have successfully unsubscribed from Blog Diaries!!!.`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ message: 'Error sending email' });
            }
            console.log('Unsubscription email sent:', info.response);
            res.status(200).json({ message: `Unsubscribed successfully! Confirmation email sent to ${email}` });
        });
    } catch (err) {
        console.error('Error unsubscribing:', err);
        res.status(500).json({ message: 'Unsubscription failed. Please try again later.' });
    }
});

app.get('/subscribers', async (req, res) => {
    try {
        const subscribers = await Subscriber.find({}, 'email');
        res.status(200).json({ subscribers: subscribers.map(s => s.email) });
    } catch (err) {
        console.error('Error fetching subscribers:', err);
        res.status(500).json({ message: 'Failed to fetch subscribers' });
    }
});


const BlogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, required: true },
    category: { type: String, required: true },
    externalLink: { type: String },
}, { timestamps: true });

const Blog = mongoose.model('Blog', BlogSchema);

app.post('/blogs/create', async (req, res) => {
    const { title, content, author, category, externalLink } = req.body;

    if (!title || !content || !author || !category) {
        return res.status(400).json({ message: 'Please fill all the required fields' });
    }

    try {
        const newBlog = new Blog({ title, content, author, category, externalLink });
        await newBlog.save();
        res.status(200).json({ message: 'Blog created successfully', blog: newBlog });
    } catch (error) {
        res.status(500).json({ message: 'Error creating blog, please try again' });
    }
});


app.get('/blogs', async (req, res) => {
    try {
        const blogs = await Blog.find();
        res.status(200).json({ blogs });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching blogs' });
    }
});


app.put('/blogs/:id', async (req, res) => {
    const { title, content, category } = req.body;
    const blogId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(blogId)) {
        return res.status(400).json({ message: 'Invalid blog ID' });
    }

    if (!title || !content || !category) {
        return res.status(400).json({ message: 'Title, content, and category are required' });
    }

    try {
        const updatedBlog = await Blog.findByIdAndUpdate(blogId, { title, content, category }, { new: true });

        if (!updatedBlog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        res.status(200).json({ message: 'Blog updated successfully', blog: updatedBlog });
    } catch (error) {
        console.error('Error updating blog:', error);
        res.status(500).json({ message: 'Error updating blog' });
    }
});

app.delete('/blogs/:id', async (req, res) => {
    const blogId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(blogId)) {
        return res.status(400).json({ message: 'Invalid blog ID' });
    }

    try {
        const deletedBlog = await Blog.findByIdAndDelete(blogId);

        if (!deletedBlog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        res.status(200).json({ message: 'Blog deleted successfully' });
    } catch (error) {
        console.error('Error deleting blog:', error);
        res.status(500).json({ message: 'Error deleting blog' });
    }
});



app.listen(4000, () => {
    console.log('Server is running on port https://localhost:4000');
});
