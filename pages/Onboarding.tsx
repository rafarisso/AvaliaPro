import React from 'react';

type OnboardingProps = {
  onSchoolCreated: () => void;
};

const Onboarding: React.FC<OnboardingProps> = ({ onSchoolCreated }) => {
  return (
    <div>
      <p>Onboarding placeholder</p>
      <button type="button" onClick={onSchoolCreated}>
        Concluir onboarding
      </button>
    </div>
  );
};

export default Onboarding;

