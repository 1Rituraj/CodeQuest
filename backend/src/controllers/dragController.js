import User from "../models/User.js";
export const skipDragQuestion = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user || user.coins < 5) {
      return res.json({ success: false });
    }

    user.coins -= 5;
    await user.save();

    res.json({
      success: true,
      coins: user.coins
    });

  } catch (err) {
    res.json({ success: false });
  }
};

export const buyDragTime = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user || user.coins < 3) {
      return res.json({ success: false });
    }

    user.coins -= 3;
    await user.save();

    res.json({
      success: true,
      coins: user.coins,
      extraTime: 15
    });

  } catch (err) {
    res.json({ success: false });
  }
};

