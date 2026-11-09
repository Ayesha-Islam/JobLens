import { ArrowRight, Briefcase } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-10 sm:py-12 px-4 sm:px-6 bg-background text-foreground">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8">
        <div className="col-span-2 md:col-span-1">
          <h3 className="font-bold mb-4">Get the latest update</h3>
          <a
            href="#"
            className="flex items-center gap-2 hover:text-primary-foreground transition-colors"
          >
            Get in touch
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
        <div>
          <h3 className="font-bold mb-4">JobLens & Co.</h3>
          <ul className="space-y-2">
            <li>
              <a href="#" className="hover:text-primary-foreground transition-colors">
                Discover Jobs
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary-foreground transition-colors">
                Help Center
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary-foreground transition-colors">
                About Us
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold mb-4">Connect</h3>
          <ul className="space-y-2">
            <li>
              <a href="#" className="hover:text-primary-foreground transition-colors">
                LinkedIn
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary-foreground transition-colors">
                Twitter
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary-foreground transition-colors">
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-card rounded flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-foreground" />
          </div>
          <span className="font-bold">JobLens & Co.</span>
        </div>
        <div className="text-sm text-center sm:text-right">
          © 2026 JobLens & Co. All rights reserved.
        </div>
      </div>
    </footer>
  );
}