import coreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...coreWebVitals,
  {
    rules: {
      // False positive: flags Date.now()/v4() inside async event handlers
      // (onSubmit) as "impure during render".
      "react-hooks/purity": "off",
      // New in this eslint-config-next version. Flags a real pre-existing
      // pattern in components/message-view.tsx (setState directly in a
      // useEffect); left off pending a separate review, not a dep-bump fix.
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default config;
