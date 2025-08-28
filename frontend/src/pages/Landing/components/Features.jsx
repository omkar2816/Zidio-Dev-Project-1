import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileSpreadsheet, 
  BarChart3, 
  Shield, 
  Zap, 
  Users, 
  TrendingUp,
  PieChart,
  LineChart,
  Database,
  Lock,
  Smartphone,
  Globe
} from 'lucide-react';
import { useScrollReveal } from '../../../hooks/useScrollAnimations';

const Features = () => {
  const { ref: headerRef, isInView: headerInView } = useScrollReveal();
  const { ref: gridRef, isInView: gridInView } = useScrollReveal({ amount: 0.2 });
  
  const features = [
    {
      icon: FileSpreadsheet,
      title: "Excel & CSV Upload",
      description: "Drag & drop Excel files (.xlsx, .xls) or CSV files with multi-sheet support and real-time validation.",
      color: "blue"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Get comprehensive statistics, correlation analysis, and categorical data insights with automated processing.",
      color: "purple"
    },
    {
      icon: PieChart,
      title: "2D & 3D Charts",
      description: "Beautiful visualizations with 50+ chart types including interactive 3D charts and animations.",
      color: "green"
    },
    {
      icon: Shield,
      title: "Secure & Protected",
      description: "Enterprise-grade security with JWT authentication, encrypted data storage, and role-based access control.",
      color: "red"
    },
    {
      icon: Users,
      title: "User Management",
      description: "Complete admin panel with user roles, activity monitoring, and system configuration options.",
      color: "yellow"
    },
    {
      icon: Zap,
      title: "Real-time Processing",
      description: "Lightning-fast data processing with live updates, notifications, and instant chart generation.",
      color: "indigo"
    }
  ];

  const mainFeatures = [
    {
      icon: Database,
      title: "Smart Data Processing",
      description: "Advanced algorithms automatically detect data patterns, handle missing values, and optimize your datasets for analysis.",
      image: "/api/placeholder/400/300"
    },
    {
      icon: TrendingUp,
      title: "Predictive Analytics",
      description: "AI-powered insights that forecast trends, identify outliers, and provide actionable recommendations for your business.",
      image: "/api/placeholder/400/300"
    },
    {
      icon: Globe,
      title: "Collaborative Platform",
      description: "Share dashboards, collaborate in real-time, and export results in multiple formats for team collaboration.",
      image: "/api/placeholder/400/300"
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
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6
      }
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
      red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
      yellow: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
      indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
    };
    return colors[color] || colors.blue;
  };

  return (
    <section id="features" className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Powerful Features for
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {" "}Data Excellence
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Everything you need to transform your Excel data into actionable insights with modern tools and enterprise security.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          ref={gridRef}
          variants={containerVariants}
          initial="hidden"
          animate={gridInView ? "visible" : "hidden"}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
            >
              <div className={`inline-flex p-3 rounded-xl ${getColorClasses(feature.color)} mb-4`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Features */}
        <div className="space-y-20">
          {mainFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className={`grid lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
              }`}
            >
              <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                <div className="inline-flex p-3 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {[
                    "Automated data cleaning and preparation",
                    "Real-time processing and validation",
                    "Export results in multiple formats"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center text-gray-600 dark:text-gray-300">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className={index % 2 === 1 ? 'lg:col-start-1' : ''}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  <div className="bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl p-8 h-80 flex items-center justify-center">
                    <feature.icon className="w-24 h-24 text-white opacity-50" />
                  </div>
                  <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
