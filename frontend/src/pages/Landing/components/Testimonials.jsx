import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const Testimonials = () => {
  const [platformStats, setPlatformStats] = useState(null);

  // Fetch platform statistics
  useEffect(() => {
    const fetchPlatformStats = async () => {
      try {
        const response = await fetch('/api/analytics/platform-stats');
        const data = await response.json();
        setPlatformStats(data);
      } catch (error) {
        console.error('Error fetching platform stats:', error);
      }
    };

    fetchPlatformStats();
  }, []);
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Data Analyst",
      company: "TechCorp Solutions",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=100&h=100&fit=crop&crop=face",
      content: "This platform has revolutionized how we handle data analysis. The 3D visualizations are stunning and the processing speed is incredible. It's saved us hours of manual work.",
      rating: 5
    },
    {
      name: "Michael Rodriguez",
      role: "Business Intelligence Manager",
      company: "Global Dynamics",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      content: "The security features and user management capabilities are top-notch. We can confidently handle sensitive financial data with complete peace of mind.",
      rating: 5
    },
    {
      name: "Emily Johnson",
      role: "Financial Analyst",
      company: "InvestTech",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      content: "The automated insights and predictive analytics have helped us make better investment decisions. The interface is intuitive and the charts are beautiful.",
      rating: 5
    },
    {
      name: "David Park",
      role: "Operations Director",
      company: "ManufacturePlus",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
      content: "We process thousands of production reports monthly. This platform makes it effortless to identify trends and optimize our operations. Highly recommended!",
      rating: 5
    },
    {
      name: "Lisa Zhang",
      role: "Research Scientist",
      company: "BioTech Labs",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
      content: "The correlation analysis and statistical tools are exactly what our research team needed. The export functionality makes sharing results with colleagues seamless.",
      rating: 5
    },
    {
      name: "James Wilson",
      role: "Marketing Analytics Lead",
      company: "Digital Agency Pro",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      content: "The real-time processing and collaborative features have transformed our reporting workflow. Our clients love the interactive dashboards we can now provide.",
      rating: 5
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6
      }
    }
  };

  return (
    <section id="testimonials" className="py-20 bg-gradient-to-br from-teal-50 via-emerald-50/40 to-green-50/30 dark:from-gray-800 dark:via-emerald-900/10 dark:to-gray-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Loved by Analytics Professionals
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
              {" "}Worldwide
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Trusted by data scientists, analysts, and business intelligence experts who rely on our platform for critical insights.
          </p>
          
          {/* Rating Summary */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center justify-center mt-8 space-x-2"
          >
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
              ))}
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white ml-3">4.9</span>
            <span className="text-gray-600 dark:text-gray-400">out of 5 (2,847 reviews)</span>
          </motion.div>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 relative"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-4 right-4 w-6 h-6 text-emerald-200 dark:text-emerald-800" />
              
              {/* Stars */}
              <div className="flex space-x-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              
              {/* Content */}
              <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
                "{testimonial.content}"
              </p>
              
              {/* Author */}
              <div className="flex items-center">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {testimonial.role}
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    {testimonial.company}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Join Leading Analytics Teams
            </h3>
            <p className="text-emerald-100 mb-6 max-w-2xl mx-auto">
              Experience the power of advanced data analytics and intelligent business insights. 
              Start your free trial today and discover why data professionals choose our platform.
            </p>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 mt-8">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {platformStats ? `${platformStats.uptime}%` : '99.9%'}
                </div>
                <div className="text-emerald-200 text-sm">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">24/7</div>
                <div className="text-emerald-200 text-sm">Support</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">SOC 2</div>
                <div className="text-emerald-200 text-sm">Compliant</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">GDPR</div>
                <div className="text-emerald-200 text-sm">Ready</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
