import mongoose  from "mongoose";

const connectToDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}`
    );
    console.log("DB connection successfull...!");
  } catch (error) {
    console.log("Error while connecting to the DATABSE ", error.message);
  }
};

export default connectToDB;
