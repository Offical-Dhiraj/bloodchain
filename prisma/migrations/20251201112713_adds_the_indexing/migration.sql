-- CreateIndex
CREATE INDEX "blood_requests_latitude_longitude_idx" ON "blood_requests"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "donor_profiles_latitude_longitude_idx" ON "donor_profiles"("latitude", "longitude");
