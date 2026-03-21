package org.example.gemininutrition.Capture;

import org.bytedeco.javacpp.BytePointer;
import org.bytedeco.javacpp.IntPointer;
import org.bytedeco.javacv.*;
import org.bytedeco.opencv.opencv_core.Mat;
import org.bytedeco.opencv.opencv_core.Size;
import org.springframework.stereotype.Service;

import static org.bytedeco.opencv.global.opencv_imgcodecs.IMWRITE_JPEG_QUALITY;
import static org.bytedeco.opencv.global.opencv_imgcodecs.imencode;
import static org.bytedeco.opencv.global.opencv_imgproc.resize;

@Service
public class CaptureService {

    public byte[] capture() throws FrameGrabber.Exception {
        FrameGrabber grabber = new OpenCVFrameGrabber(0);
        grabber.setImageWidth(640);
        grabber.setImageHeight(480);

        try {
            grabber.start();

            // Warm up — Windows MSMF cameras need a few frames to stabilize
            for (int i = 0; i < 5; i++) {
                grabber.grab();
                try { Thread.sleep(100); } catch (InterruptedException ignored) {}
            }

            Mat mat = null;
            OpenCVFrameConverter.ToMat converter = new OpenCVFrameConverter.ToMat();

            for (int attempt = 0; attempt < 10; attempt++) {
                Frame frame = grabber.grab();
                if (frame != null && frame.image != null) {
                    mat = converter.convert(frame);
                    if (mat != null && !mat.empty()) {
                        break;
                    }
                }
                try { Thread.sleep(100); } catch (InterruptedException ignored) {}
            }

            if (mat == null || mat.empty()) {
                throw new RuntimeException("Camera failed to produce a valid frame after retries");
            }
            Mat resized = new Mat();
            resize(mat, resized, new Size(640, 480));

            BytePointer buffer = new BytePointer();
            IntPointer params = new IntPointer(IMWRITE_JPEG_QUALITY, 60);

            try {
                imencode(".jpg", resized, buffer, params);
                byte[] imageBytes = new byte[(int) buffer.limit()];
                buffer.get(imageBytes);
                return imageBytes;
            } finally {
                mat.release();
                resized.release();
                buffer.deallocate();
            }

        } finally {
            grabber.stop();
            grabber.release();
        }
    }
}