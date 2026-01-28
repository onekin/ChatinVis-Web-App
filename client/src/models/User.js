import mongoose from 'mongoose';
  import bcrypt from 'bcryptjs';

  const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  });

  userSchema.pre("save",async function(text){
    if(!this.isModified("password")) return next();
    this.password=await bcrypt.hash(this.password,10);
    next();
  })

  userSchema.methods.comparePass=async function(password){
    return await bcrypt.compare(password,this.password)
  };

  export default mongoose.model('User',userSchema)
  
