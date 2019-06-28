const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Mutation = {
    async createItem(parent, args, ctx, info) {
        //@todo check if user is logged in
        const item =  await ctx.db.mutation.createItem({
            data: {
                ...args
            } 
        }, info);
        return item;
    },
    updateItem(parent, args, ctx, info) {
        const updates = { ...args };
        //delete id from updates so we can pass as data
        delete updates.id;
        //run update method
        return ctx.db.mutation.updateItem({
            data: updates,
            where: {
                id: args.id
            }
        }, info)
    },
   async deleteItem(parent, args, ctx, info) {
       const where = { id: args.id };
       //find item
        const item = await ctx.db.query.item({where}, `{ id title}`)
        //see if owner/has permission do delete
        // @todo
        //delete it
        return ctx.db.mutation.deleteItem({ where }, info)
    },
    async signup(parent, args, ctx, info) {
        args.email = args.email.toLowerCase().trim();
        //hash password
        const password = await bcrypt.hash(args.password, 10);
        //create user in db
        const user = await ctx.db.mutation.createUser({
            data: {
                ...args,
                password,
                permissions: { set: ['USER']}
            }
        }, 
        info
        );
        //create jwt
        const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET)
        //now set token as a cookie in response
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365, //1 year
        });
        //finally return the user to the browser
        return user;
    },
    async signin(parent, {email, password}, ctx, info) {
        //1. check if there is a user with entered email
        const user = await ctx.db.query.user({
            where: { email}
        })
        if (!user) {
            throw new Error(`No such user found for email ${email}`);
        }
        //2. check if password is correct
        const valid = await bcrypt.compare(password, user.password);
        if ( ! valid) {
            throw new Error('Invalid Password')
        }
        //3. generate jwt
        const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET)
        //4. set cookie with token
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365, //1 year
        });
        //5. return user
        return user;
    }
};

module.exports = Mutation;
