# Indexing strategy

Unique indexes protect email, matriculation number, staff number, course code, `(studentId, courseOfferingId)` registration and `(lecturerId, courseOfferingId)` assignment rules. Query indexes support offerings by semester/programme, registrations by offering/status, result workflow status/submission time, schedules by offering/day, notifications by user/read/time, and upload errors by batch/row.

Partial unique indexes permit one current semester and prevent duplicate global grading-policy names when `programmeId` is null. These indexes match implemented repository queries rather than speculative columns.
