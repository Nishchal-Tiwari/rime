import QRCode from "qrcode";

const generateQR = async (data) => {
    try {
        return await QRCode.toDataURL(data);
    } catch (err) {
        console.error(err);
        throw err;
    }
};


export default  generateQR;
