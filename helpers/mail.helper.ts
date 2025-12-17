// import nodeMailer from 'nodemailer';

// export const sendMail = async(
//     email: string, 
//     subject: string,
//     html: string
// ): Promise<void> => {
//     try {
//         const transporter = nodeMailer.createTransport({
//             service: 'gmail',
//             auth: {
//                 user: process.env.EMAIL_USER,
//                 pass: process.env.EMAIL_PASS
//             }
//         });
//         const mailOptions = {
//             from: process.env.EMAIL_USER,
//             to: email,
//             subject,
//             html
//         };
//         await transporter.sendMail(mailOptions);
//         console.log('Gửi email thành công đến:', email);
//     } catch (error) {
//         console.error('Gửi email thất bại:', error)
//     }
// }
import dotenv from "dotenv";
dotenv.config();
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export const sendMail = async (
    email: string,
    subject: string,
    html: string
) => {
    try {
        await sgMail.send({
            to: email,
            from: process.env.EMAIL_USER!,
            subject,
            html
        });
        console.log('Gửi email thành công đến:', email);
    } catch (error) {
        console.error('Gửi email thất bại:', error);
    }
}