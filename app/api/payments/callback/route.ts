import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import pingxxClient from "@/lib/pingpp";

const prisma = new PrismaClient();

/**
 * Webhook callback handler for Ping++ payment notifications
 *
 * Ping++ will POST to this endpoint with payment status updates.
 * We need to:
 * 1. Verify the webhook signature
 * 2. Check the payment status
 * 3. Update the database accordingly
 * 4. Add points to user if payment succeeded
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get("x-pingplusplus-signature");

    if (!signature) {
      console.warn("Missing webhook signature header");
      return NextResponse.json(
        { message: "Missing signature" },
        { status: 400 }
      );
    }

    // Verify the webhook signature
    if (!pingxxClient.verifySignature(rawBody, signature)) {
      console.warn("Invalid webhook signature");
      return NextResponse.json(
        { message: "Invalid signature" },
        { status: 403 }
      );
    }

    // Parse the webhook data
    const data = JSON.parse(rawBody);

    // Handle different webhook events
    const event = data.type;

    if (event === "charge.succeeded") {
      return await handleChargeSucceeded(data.data.object);
    } else if (event === "charge.failed") {
      return await handleChargeFailed(data.data.object);
    } else if (event === "refund.succeeded") {
      return await handleRefundSucceeded(data.data.object);
    } else {
      console.log(`Ignoring webhook event: ${event}`);
      return NextResponse.json(
        { message: "Event acknowledged" },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { message: "Processing error" },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment
 */
async function handleChargeSucceeded(chargeData: any) {
  try {
    const transactionId = chargeData.id;
    const amount = chargeData.amount / 100; // Convert from cents to yuan

    // Find payment record
    const payment = await prisma.payment.findFirst({
      where: {
        transactionId,
      },
    });

    if (!payment) {
      console.warn(`Payment not found for transaction: ${transactionId}`);
      return NextResponse.json(
        { message: "Payment not found" },
        { status: 404 }
      );
    }

    // Prevent duplicate processing
    if (payment.status === "completed") {
      console.log(`Payment already completed: ${transactionId}`);
      return NextResponse.json(
        { message: "Payment already processed" },
        { status: 200 }
      );
    }

    // 验证金额是否匹配（防止webhook数据被篡改）
    if (Math.abs(amount - payment.amount) > 0.01) {
      // 允许0.01元的误差（浮点数精度）
      console.error(
        `Amount mismatch: webhook=${amount}, database=${payment.amount}, transaction=${transactionId}`
      );
      return NextResponse.json(
        { message: "Amount verification failed" },
        { status: 400 }
      );
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: payment.userId },
    });

    if (!user) {
      console.error(`User not found: ${payment.userId}`);
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "completed",
      },
    });

    // Add points to user
    const updatedUser = await prisma.user.update({
      where: { id: payment.userId },
      data: {
        points: user.points + payment.pointsAdded,
      },
    });

    console.log(
      `Payment succeeded: ${transactionId}, added ${payment.pointsAdded} points to user ${payment.userId}`
    );

    return NextResponse.json(
      {
        message: "Payment processed successfully",
        transactionId,
        userId: payment.userId,
        pointsAdded: payment.pointsAdded,
        userPoints: updatedUser.points,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing successful payment:", error);
    return NextResponse.json(
      { message: "Processing error" },
      { status: 500 }
    );
  }
}

/**
 * Handle failed payment
 */
async function handleChargeFailed(chargeData: any) {
  try {
    const transactionId = chargeData.id;

    // Find payment record
    const payment = await prisma.payment.findFirst({
      where: {
        transactionId,
      },
    });

    if (!payment) {
      console.warn(`Payment not found for transaction: ${transactionId}`);
      return NextResponse.json(
        { message: "Payment not found" },
        { status: 404 }
      );
    }

    // Update payment status to failed
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "failed",
      },
    });

    console.log(
      `Payment failed: ${transactionId}, reason: ${chargeData.failure_msg}`
    );

    return NextResponse.json(
      {
        message: "Payment failure recorded",
        transactionId,
        reason: chargeData.failure_msg,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing failed payment:", error);
    return NextResponse.json(
      { message: "Processing error" },
      { status: 500 }
    );
  }
}

/**
 * Handle refund success
 */
async function handleRefundSucceeded(refundData: any) {
  try {
    const chargeId = refundData.charge;
    const refundAmount = refundData.amount / 100; // Convert from cents to yuan

    // Find payment record by charge ID
    const payment = await prisma.payment.findFirst({
      where: {
        transactionId: chargeId,
      },
    });

    if (!payment) {
      console.warn(`Payment not found for charge: ${chargeId}`);
      return NextResponse.json(
        { message: "Payment not found" },
        { status: 404 }
      );
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: payment.userId },
    });

    if (!user) {
      console.error(`User not found: ${payment.userId}`);
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Calculate points to deduct (proportional to refund amount)
    const pointsToDeduct = Math.round(
      (refundAmount / payment.amount) * payment.pointsAdded
    );

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "refunded",
      },
    });

    // Deduct points from user
    const updatedUser = await prisma.user.update({
      where: { id: payment.userId },
      data: {
        points: Math.max(0, user.points - pointsToDeduct),
      },
    });

    console.log(
      `Refund processed: ${chargeId}, deducted ${pointsToDeduct} points from user ${payment.userId}`
    );

    return NextResponse.json(
      {
        message: "Refund processed successfully",
        chargeId,
        userId: payment.userId,
        pointsDeducted: pointsToDeduct,
        userPoints: updatedUser.points,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing refund:", error);
    return NextResponse.json(
      { message: "Processing error" },
      { status: 500 }
    );
  }
}
