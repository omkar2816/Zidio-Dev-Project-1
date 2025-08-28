import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react';

const CTA = ({ onGetStarted, onSignIn }) => {
  const navigate = useNavigate();

  const features = [
    "No credit card required",
    "Full access to all features",
    "24/7 customer support",
    "Cancel anytime"
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="inline-flex items-center px-4 py-2 bg-white/20 rounded-full text-white text-sm font-medium mb-6 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Limited Time Offer - Start Free Today
            </div>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Ready to Transform
              <br />
              Your Data Analysis?
            </h2>
            
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Join thousands of professionals who use our platform to turn Excel data into actionable insights. 
              Start your free trial today and experience the future of data analytics.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onGetStarted}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSignIn}
              className="bg-transparent text-white px-8 py-4 rounded-xl font-semibold text-lg border-2 border-white/30 hover:border-white/50 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
            >
              Sign In
            </motion.button>
          </motion.div>

          {/* Features List */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-6 mb-12"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="flex items-center text-blue-100"
              >
                <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                <span className="font-medium">{feature}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm border border-white/20"
          >
            <p className="text-blue-100 mb-6">
              Trusted by data professionals at leading companies worldwide
            </p>
            
            {/* Company Logos Placeholder */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
              {[
                "TechCorp",
                "DataFlow",
                "Analytics Pro",
                "InsightLab"
              ].map((company, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className="text-white/60 font-semibold text-lg"
                >
                  {company}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Bottom Text */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-blue-200 text-sm mt-8"
          >
            By signing up, you agree to our Terms of Service and Privacy Policy.
            <br />
            Free trial includes full access to all premium features for 14 days.
          </motion.p>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-blue-900/50 to-transparent"></div>
    </section>
  );
};

export default CTA;
