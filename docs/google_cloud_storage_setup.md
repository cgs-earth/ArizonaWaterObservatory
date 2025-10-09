This project uses google cloud storage for storing zarr data.

To set this up:

1. Create a Service Account with an appropriate role assigned to it (Think of what kind of access does your application need to the storage bucket?
2. Create HMAC keys (Cloud Storage -> Settings -> Interoperability) by clicking on ‘Create a key for a Service Account’ and then proceed to select the Service Account you created in the previous step
3. Put the keys in the .env file 