import business from "../../../models/business.js"
import User  from "../../../models/user.js";

const deletebusiness = async (req, res) => {
   
    const user_id = req.user._id;

    try {
        // Delete the business
        const user = await User.findById(user_id);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const deletedbusiness = await business.findByIdAndDelete(user.business_id);

        if (!deletedbusiness) {
            return res.status(404).json({ error: "business not found." });
        }

        // Update user's business list
        await User.findByIdAndUpdate(user_id, {
            $set: { business_id: null }
        });

        res.status(200).json({ message: "business deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export default deletebusiness;
