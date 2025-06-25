import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    const where = status ? { status } : {};

    const savedJobs = await prisma.savedJob.findMany({
      where,
      include: {
        job: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(savedJobs);
  } catch (error) {
    console.error('Failed to fetch saved jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { jobId, notes, status = 'interested' } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID required' },
        { status: 400 }
      );
    }

    const savedJob = await prisma.savedJob.create({
      data: {
        jobId,
        notes,
        status
      },
      include: {
        job: true
      }
    });

    return NextResponse.json(savedJob);
  } catch (error) {
    console.error('Failed to save job:', error);
    return NextResponse.json(
      { error: 'Failed to save job' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, notes, status } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Saved job ID required' },
        { status: 400 }
      );
    }

    const updatedJob = await prisma.savedJob.update({
      where: { id },
      data: {
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status })
      },
      include: {
        job: true
      }
    });

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error('Failed to update saved job:', error);
    return NextResponse.json(
      { error: 'Failed to update saved job' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Saved job ID required' },
        { status: 400 }
      );
    }

    await prisma.savedJob.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete saved job:', error);
    return NextResponse.json(
      { error: 'Failed to delete saved job' },
      { status: 500 }
    );
  }
}