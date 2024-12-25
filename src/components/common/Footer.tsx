import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Github, Twitter, Linkedin } from 'lucide-react';
import { themeConfig } from '../../config/theme';

const Footer = () => {
  return (
    <footer className={`bg-${themeConfig.colors.background.light} dark:bg-${themeConfig.colors.background.dark} border-t border-${themeConfig.colors.border.light} dark:border-${themeConfig.colors.border.dark}`}>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center">
              <GraduationCap className={`h-8 w-8 text-${themeConfig.colors.primary.light} dark:text-${themeConfig.colors.primary.dark}`} />
              <span className={`ml-2 text-2xl font-bold text-${themeConfig.colors.text.primary.light} dark:text-${themeConfig.colors.text.primary.dark}`}>
                Epsilora
              </span>
            </Link>
            <p className={`text-${themeConfig.colors.text.secondary.light} dark:text-${themeConfig.colors.text.secondary.dark}`}>
              Transforming education through AI-powered learning experiences.
            </p>
          </div>
          
          <div>
            <h3 className={`font-semibold text-${themeConfig.colors.text.primary.light} dark:text-${themeConfig.colors.text.primary.dark} mb-4`}>Features</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/progress" 
                  className={`text-${themeConfig.colors.text.secondary.light} dark:text-${themeConfig.colors.text.secondary.dark} hover:text-${themeConfig.colors.primary.light} dark:hover:text-${themeConfig.colors.primary.dark} transition-colors duration-300`}
                >
                  Progress Tracking
                </Link>
              </li>
              <li>
                <Link 
                  to="/quiz" 
                  className={`text-${themeConfig.colors.text.secondary.light} dark:text-${themeConfig.colors.text.secondary.dark} hover:text-${themeConfig.colors.primary.light} dark:hover:text-${themeConfig.colors.primary.dark} transition-colors duration-300`}
                >
                  Interactive Quizzes
                </Link>
              </li>
              <li>
                <Link 
                  to="/courses" 
                  className={`text-${themeConfig.colors.text.secondary.light} dark:text-${themeConfig.colors.text.secondary.dark} hover:text-${themeConfig.colors.primary.light} dark:hover:text-${themeConfig.colors.primary.dark} transition-colors duration-300`}
                >
                  Course Management
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className={`font-semibold text-${themeConfig.colors.text.primary.light} dark:text-${themeConfig.colors.text.primary.dark} mb-4`}>Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/ai-assist" 
                  className={`text-${themeConfig.colors.text.secondary.light} dark:text-${themeConfig.colors.text.secondary.dark} hover:text-${themeConfig.colors.primary.light} dark:hover:text-${themeConfig.colors.primary.dark} transition-colors duration-300`}
                >
                  AI Assistant
                </Link>
              </li>
              <li>
                <Link 
                  to="/documentation" 
                  className={`text-${themeConfig.colors.text.secondary.light} dark:text-${themeConfig.colors.text.secondary.dark} hover:text-${themeConfig.colors.primary.light} dark:hover:text-${themeConfig.colors.primary.dark} transition-colors duration-300`}
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link 
                  to="/support" 
                  className={`text-${themeConfig.colors.text.secondary.light} dark:text-${themeConfig.colors.text.secondary.dark} hover:text-${themeConfig.colors.primary.light} dark:hover:text-${themeConfig.colors.primary.dark} transition-colors duration-300`}
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className={`font-semibold text-${themeConfig.colors.text.primary.light} dark:text-${themeConfig.colors.text.primary.dark} mb-4`}>Connect</h3>
            <div className="flex space-x-4">
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`text-${themeConfig.colors.text.muted.light} dark:text-${themeConfig.colors.text.muted.dark} hover:text-${themeConfig.colors.primary.light} dark:hover:text-${themeConfig.colors.primary.dark} transition-colors duration-300`}
              >
                <Twitter className="h-6 w-6" />
              </a>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`text-${themeConfig.colors.text.muted.light} dark:text-${themeConfig.colors.text.muted.dark} hover:text-${themeConfig.colors.primary.light} dark:hover:text-${themeConfig.colors.primary.dark} transition-colors duration-300`}
              >
                <Github className="h-6 w-6" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`text-${themeConfig.colors.text.muted.light} dark:text-${themeConfig.colors.text.muted.dark} hover:text-${themeConfig.colors.primary.light} dark:hover:text-${themeConfig.colors.primary.dark} transition-colors duration-300`}
              >
                <Linkedin className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className={`text-center text-${themeConfig.colors.text.muted.light} dark:text-${themeConfig.colors.text.muted.dark}`}>
            &copy; {new Date().getFullYear()} Epsilora. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;