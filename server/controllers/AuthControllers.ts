// CONTROLLERS FOR USER REGISTRATION
import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcrypt";

// ================= REGISTER =================
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // 🔎 Validate fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // 🔥 Session
    req.session.isLoggedIn = true;
    req.session.userId = newUser._id.toString();

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });

  } catch (error: any) {
    console.error("Register Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ================= LOGIN =================
export const LoginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 🔎 Validate fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 🔥 Session
    req.session.isLoggedIn = true;
    req.session.userId = user._id.toString();

    return res.json({
      success: true,
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error: any) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ================= LOGOUT =================
export const LogoutUser = async (req: Request, res: Response) => {
  try {
    req.session.destroy((error) => {
      if (error) {
        console.error("Logout Error:", error);
        return res.status(500).json({
          success: false,
          message: "Logout failed",
        });
      }

      return res.json({
        success: true,
        message: "Logout successful",
      });
    });
  } catch (error: any) {
    console.error("Logout Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ================= VERIFY =================
export const VerifyUser = async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const user = await User.findById(req.session.userId).select("-password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid user",
      });
    }

    return res.json({
      success: true,
      user,
    });

  } catch (error: any) {
    console.error("Verify Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
