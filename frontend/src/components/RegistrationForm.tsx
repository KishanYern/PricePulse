import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const RegistrationForm = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [errors, setErrors] = useState({
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear error when user starts typing
        if (errors[name as keyof typeof errors]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {
            email: "",
            password: "",
            confirmPassword: "",
        };

        // Email validation
        const emailRegex: RegExp =
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 8) {
            newErrors.password = "Password must be at least 8 characters long";
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);
        return !Object.values(newErrors).some((error) => error !== ""); // Check if one of the errors is not empty
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Prevent default form submission

        if (!validateForm()) {
            // If validation fails, do not proceed
            return;
        }

        setIsLoading(true); // Set Loading while making the fetch request to the server

        try {
            // Call the API endpoint to register the user
            // Pass the lowercase email to the API
            const response = await axios.post(
                "http://localhost:8000/users/create",
                {
                    email: formData.email.toLowerCase(),
                    password: formData.password,
                },
                {
                    withCredentials: true, // Include credentials for token handling
                }
            );
            if (response.status !== 201) {
                // Handle other response statuses as needed
                if (response.status === 400) {
                    setErrors((prev) => ({
                        ...prev,
                        email: "Email already exists",
                    }));
                }
                if (response.status === 500) {
                    setErrors((prev) => ({
                        ...prev,
                        email: "Server error, please try again later",
                    }));
                }
                return; // Stop execution if there was an error
            }

            // If registration is successful, redirect to the home page
            navigate("/home", { replace: true });
        } catch (error) {
            console.error("Registration failed:", error);
            alert("Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Email Field */}
            <div className='form-control'>
                <label className='label'>
                    <span className='label-text font-medium'>
                        Email Address
                    </span>
                </label>
                <div className='relative'>
                    <input
                        type='email'
                        name='email'
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder='Enter your email'
                        className={`input input-bordered w-full pr-10 ${
                            errors.email ? "input-error" : ""
                        }`}
                    />
                    <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
                        <svg
                            className='w-5 h-5 text-base-content/40'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207'
                            />
                        </svg>
                    </div>
                </div>
                {errors.email && (
                    <label className='label'>
                        <span className='label-text-alt text-error'>
                            {errors.email}
                        </span>
                    </label>
                )}
            </div>

            {/* Password Field */}
            <div className='form-control'>
                <label className='label'>
                    <span className='label-text font-medium'>Password</span>
                </label>
                <div className='relative'>
                    <input
                        type={showPassword ? "text" : "password"}
                        name='password'
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder='Enter your password'
                        className={`input input-bordered w-full pr-10 ${
                            errors.password ? "input-error" : ""
                        }`}
                    />
                    <button
                        type='button'
                        onClick={() => setShowPassword(!showPassword)}
                        className='absolute inset-y-0 right-0 flex items-center pr-3 hover:text-primary transition-colors'
                    >
                        {showPassword ? (
                            <svg
                                className='w-5 h-5'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                                />
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                                />
                            </svg>
                        ) : (
                            <svg
                                className='w-5 h-5'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21'
                                />
                            </svg>
                        )}
                    </button>
                </div>
                {errors.password && (
                    <label className='label'>
                        <span className='label-text-alt text-error'>
                            {errors.password}
                        </span>
                    </label>
                )}
                {/* Password requirements */}
                <label className='label'>
                    <span className='label-text-alt text-base-content/60'>
                        Must be at least 8 characters long
                    </span>
                </label>
            </div>

            {/* Confirm Password Field */}
            <div className='form-control'>
                <label className='label'>
                    <span className='label-text font-medium'>
                        Confirm Password
                    </span>
                </label>
                <div className='relative'>
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        name='confirmPassword'
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder='Re-enter your password'
                        className={`input input-bordered w-full pr-10 ${
                            errors.confirmPassword ? "input-error" : ""
                        }`}
                    />
                    <button
                        type='button'
                        onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                        }
                        className='absolute inset-y-0 right-0 flex items-center pr-3 hover:text-primary transition-colors'
                    >
                        {showConfirmPassword ? (
                            <svg
                                className='w-5 h-5'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                                />
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                                />
                            </svg>
                        ) : (
                            <svg
                                className='w-5 h-5'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21'
                                />
                            </svg>
                        )}
                    </button>
                </div>
                {errors.confirmPassword && (
                    <label className='label'>
                        <span className='label-text-alt text-error'>
                            {errors.confirmPassword}
                        </span>
                    </label>
                )}
            </div>

            {/* Terms and Conditions */}
            <div className='form-control'>
                <label className='label cursor-pointer justify-start gap-3'>
                    <input
                        type='checkbox'
                        className='checkbox checkbox-primary'
                    />
                    <span className='label-text'>
                        I agree to the{" "}
                        <a href='/terms' className='link link-primary'>
                            Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href='/privacy' className='link link-primary'>
                            Privacy Policy
                        </a>
                    </span>
                </label>
            </div>

            {/* Submit Button */}
            <button
                type='submit'
                disabled={isLoading}
                className='btn btn-primary w-full'
            >
                {isLoading ? (
                    <span className='flex items-center justify-center gap-2'>
                        <span className='loading loading-spinner loading-sm'></span>
                        <span>Creating Account...</span>
                    </span>
                ) : (
                    <span className='flex items-center justify-center gap-2'>
                        <svg
                            className='w-5 h-5'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'
                            />
                        </svg>
                        <span>Create Account</span>
                    </span>
                )}
            </button>
        </form>
    );
};

export default RegistrationForm;
