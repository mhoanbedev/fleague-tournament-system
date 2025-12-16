import mongoose, { Schema, Document, Model } from "mongoose";

export interface IForgotPassword extends Document {
    email: string;
    otp: string;
    expireAt: Date;
    createdAt: Date;   
    updatedAt: Date;
}

const forgotPasswordSchema: Schema<IForgotPassword> = new Schema(
    {
        email: {
            type: String,
            required: true,
            index: true
        },
        otp: {
            type: String,
            required: true,
        },
        expireAt: {
            type: Date,
            required: true,
            expires: 180,
        },
    },
    {
        timestamps: true,
    }
);

const ForgotPassword: Model<IForgotPassword> =
  mongoose.models.ForgotPassword ||
  mongoose.model<IForgotPassword>(
    'ForgotPassword',
    forgotPasswordSchema,
    'forgot-passwords'
  );

export default ForgotPassword;