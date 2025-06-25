import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const searchId = searchParams.get('searchId');
    const minScore = searchParams.get('minScore');
    const location = searchParams.get('location');
    const company = searchParams.get('company');

    let where: any = {};
    
    if (searchId) {
      where.searchId = searchId;
    }
    
    if (minScore) {
      where.score = { gte: parseInt(minScore) };
    }
    
    if (location) {
      where.location = { contains: location };
    }
    
    if (company) {
      where.company = { contains: company };
    }

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { score: 'desc' },
      include: {
        savedJob: true
      }
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchId } = await request.json();
    
    if (!searchId) {
      return NextResponse.json(
        { error: 'Search ID required' },
        { status: 400 }
      );
    }

    await prisma.search.delete({
      where: { id: searchId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete search:', error);
    return NextResponse.json(
      { error: 'Failed to delete search' },
      { status: 500 }
    );
  }
}