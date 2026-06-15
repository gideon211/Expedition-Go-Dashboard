import WizardProgressBar from "./WizardProgressBar";
import WizardNavFooter from "./WizardNavFooter";

export default function WizardStepLayout({ children, title, description }) {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Progress Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 mb-4 md:mb-6 overflow-x-auto shadow-sm">
        <WizardProgressBar />
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {/* Step Header */}
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-200">
          <h2 className="text-base md:text-lg font-semibold text-slate-800">{title}</h2>
          {description && (
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          )}
        </div>

        {/* Step Body */}
        <div className="p-4 md:p-6">{children}</div>

        {/* Step Footer */}
        <div className="px-4 md:px-6 py-3 md:py-4 border-t border-slate-200">
          <WizardNavFooter />
        </div>
      </div>
    </div>
  );
}
