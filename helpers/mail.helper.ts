import nodeMailer from 'nodemailer';

export const sendMail = async(
    email: string, 
    subject: string,
    html: string
): Promise<void> => {
    try {
        const transporter = nodeMailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject,
            html
        };
        await transporter.sendMail(mailOptions);
        console.log('Gửi email thành công đến:', email);
    } catch (error) {
        console.error('Gửi email thất bại:', error)
    }
}