## **OCI Vault → K8s Secret**

- OCI Vault stores secret (encrypted)  
- K8s **cannot** auto‑pull from Vault  
- Need a **driver/operator** to sync  
  - OCI Secrets Store CSI Driver  
  - OR External Secrets Operator (OCI provider)  
- Rotation happens in Vault → driver updates K8s Secret  
- Backend always reads **K8s Secret**, not Vault  
---