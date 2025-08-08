import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const LoginForm: React.FC = () => {
    const navigate = useNavigate();
    const { login: authLogin } = useAuth(); // Get the login function from AuthContext
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [errors, setErrors] = useState({
        email: "",
        password: "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
        // Form element should handle normal validations for the email and password
        const newErrors = {
            email: "",
            password: "",
            confirmPassword: "",
        };

        // Email validation
        if (!formData.email) {
            newErrors.email = "Email is required";
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = "Password is required";
        }

        setErrors(newErrors);
        return !Object.values(newErrors).some((error) => error !== ""); // Check if one of the errors is not empty
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Prevent default form submission

        if (!validateForm()) {
            // If validation fails, do not proceed
            console.error("Form validation failed:", errors);
            return;
        }

        setIsLoading(true); // Set Loading while making the fetch request to the server

        try {
            // Pass the lowercase email to the login function
            await authLogin(formData.email.toLowerCase(), formData.password); // Call the login function from AuthContext
            navigate("/"); // Redirect to home page after successful login
        } catch (error) {
            console.error("Login failed:", error);
            alert("Login failed. Please try again.");
            setErrors((prev) => ({
                ...prev,
                email: "Invalid email or password",
                password: "Invalid email or password",
            }));
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
                        required
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
                        required
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
                        <span>Signing In...</span>
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
                        <span>Sign In</span>
                    </span>
                )}
            </button>
        </form>
    );
};

export default LoginForm;
