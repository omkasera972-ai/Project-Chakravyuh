import os

file_path = r"c:\Users\ashwi\Downloads\Project-Chakravyuh-rebuilt\Project-Chakravyuh-rebuilt\Project-Chakravyuh-Prototype\src\context\AppContext.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Find line 1866: acknowledgeAlert,
cutoff_idx = -1
for idx, line in enumerate(lines):
    if "acknowledgeAlert," in line and idx > 1800:
        cutoff_idx = idx
        break

if cutoff_idx != -1:
    clean_lines = lines[:cutoff_idx + 1]
    tail = """        resolveAlert,
        deleteAlert,
        deleteMultipleAlerts,
        clearAllAlerts,
        addMissingChild,
        deleteMissingChild,
        addDetectionReport,
        addVehicle,
        addVehicleRecord,
        addInventory,
        addAnprScan,
        addAttendanceScan,
        addCriminalDetection,
        addDefenceScan,
        addReport,
        saveSystemSettings,
        updateDepotMovement,
        triggerMovementBreach,
        deleteDepotItem,
        toggleCameraStatus,
        dispatchPhoneNumbers,
        addDispatchNumber,
        removeDispatchNumber,
        officers,
        fetchOfficers,
        addOfficer,
        updateOfficer,
        deleteOfficer,
        userLocation,
        setUserLocation,
        pendingCameraLocation,
        setPendingCameraLocation,
        fetchCameras,
        updateCamera,
        authFetch
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
"""
    with open(file_path, "w", encoding="utf-8") as f:
        f.writelines(clean_lines)
        f.write(tail)
    print(f"Successfully cleaned AppContext.jsx! Total lines now: {len(clean_lines) + len(tail.splitlines())}")
else:
    print("Could not find cutoff index!")
