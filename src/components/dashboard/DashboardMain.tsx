import React, { useState } from "react";
import DashboardSelector from "./DashboardSelector";
import DashboardProfile from "./DashboardProfile";
import DashboardDetails from "./DashboardDetails";
import DashboardClaims from "./DashboardClaims";
import DashboardPolicies from "./DashboardPolicies";
import DashboardKyc from "./DashboardKyc";
import DashboardHelp from "./DashboardHelp";
import ResetPassword from "./ResetPassword";

import styles from "@/styles/components/dashboard/DashboardMain.module.css";

function DashboardMain() {
  const [componentToShow, setComponentToShow] = useState(0);
  return (
    <div className={styles.cont}>
      {/* main content */}
      <DashboardSelector
        selected={componentToShow}
        setSelected={setComponentToShow}
      />
      {componentToShow == 0 && <DashboardDetails />}
      {componentToShow == 1 && <DashboardProfile />}
      {componentToShow == 2 && <DashboardPolicies />}
      {componentToShow == 3 && <DashboardClaims />}
      {componentToShow == 4 && <DashboardKyc />}
      {componentToShow == 5 && <DashboardHelp />}
      {componentToShow == 6 && <ResetPassword/>}


    </div>
  );
}

export default DashboardMain;
