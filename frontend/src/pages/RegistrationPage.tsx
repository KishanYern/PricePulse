import React from "react";
import RegistrationForm from "../components/RegistrationForm";
import { NavLink } from "react-router";

const RegistrationPage : React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-secondary/10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-accent/10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Main registration card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="card bg-base-100 shadow-2xl border border-base-300">
          <div className="card-body p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Price Tracker
              </h1>
              
              <h2 className="text-2xl font-semibold text-base-content mt-2">
                Create Account
              </h2>
              
              <p className="text-base-content/70 mt-2">
                Join thousands saving money with smart price tracking
              </p>
            </div>

            {/* Registration Form */}
            <div className="mb-6">
              <RegistrationForm />
            </div>

            {/* Divider */}
            <div className="divider text-base-content/50">or</div>

            {/* Footer */}
            <div className="text-center">
              <p className="text-sm text-base-content/70">
                Already have an account?{' '}
                <NavLink to="/login" className="link link-primary font-medium">
                  Sign in here
                </NavLink>
              </p>
            </div>
          </div>
        </div>

        {/* Additional info cards */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-base-100/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-2xl mb-2">🔔</div>
            <p className="text-sm text-white/90 font-medium">Price Alerts</p>
          </div>
          <div className="bg-base-100/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-sm text-white/90 font-medium">Price History</p>
          </div>
          <div className="bg-base-100/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-2xl mb-2">💰</div>
            <p className="text-sm text-white/90 font-medium">Best Deals</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;